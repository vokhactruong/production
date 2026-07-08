import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";
import { SessionCompletionPolicy } from "../class-sessions/session-completion.policy";
import { AttendanceRepository, AttendanceRecord } from "./attendance.repository";
import {
  RecordSessionAttendanceDto,
  AttendanceRecordItemDto,
  CorrectAttendanceDto,
  AttendanceQueryDto,
} from "./dto/attendance.dto";

type SessionForRecording = {
  id: string;
  classId: string;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  date: Date;
  endTime: Date;
};

/** Post-48h corrections require the distinct `attendance.correct` permission
 * (checked as a permission — never a role name — per decisions.md). */
const ATTENDANCE_CORRECT_PERMISSION = "attendance.correct";

/** 48h correction window (approved D3), anchored to the session END datetime
 * (session.date + endTime) — tied to the lesson event, not to when the row
 * happened to be created. */
const CORRECTION_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Evidence recording for the Participation Management capability: WHO
 * participated in WHICH session. This service owns the writes (bulk roster
 * recording + corrections, always audited, never deleted); the business
 * consequence (lesson consumption) lives in LessonConsumptionService as a
 * derived query — no consumption code runs here or anywhere at completion.
 */
@Injectable()
export class AttendanceApplicationService implements SessionCompletionPolicy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  private sessionEndDateTime(session: { date: Date; endTime: Date }): Date {
    const end = new Date(session.date);
    end.setUTCHours(
      session.endTime.getUTCHours(),
      session.endTime.getUTCMinutes(),
      session.endTime.getUTCSeconds(),
      0
    );
    return end;
  }

  /**
   * D3: within 48h of the session's end, `attendance.update` suffices; after
   * that, changing evidence requires `attendance.correct`. Applied to every
   * update of existing evidence (PATCH and bulk alike), so the bulk endpoint
   * cannot be used to sidestep the correction window.
   */
  private assertCorrectionWindow(session: { date: Date; endTime: Date }, user: RequestUser) {
    const deadline = this.sessionEndDateTime(session).getTime() + CORRECTION_WINDOW_MS;
    if (Date.now() <= deadline) return;
    if (user.permissions.includes(ATTENDANCE_CORRECT_PERMISSION)) return;
    throw new ForbiddenException(
      "Đã quá thời hạn 48 giờ sau khi buổi học kết thúc, bạn không có quyền sửa điểm danh"
    );
  }

  async findAll(query: AttendanceQueryDto) {
    const {
      classSessionId,
      classId,
      studentId,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    // classId/studentId filter through the enrollment relation — attendance
    // never stores denormalized class/student columns (evidence stays minimal).
    const where: Prisma.AttendanceWhereInput = {
      deletedAt: null,
      ...(classSessionId && { classSessionId }),
      ...(status && { status }),
      ...(classId && { enrollment: { is: { classId } } }),
      ...(studentId && { enrollment: { is: { studentId } } }),
    };

    const [items, total] = await Promise.all([
      this.attendanceRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.attendanceRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Idempotent bulk roster recording for one session. Idempotency comes from
   * the DB partial-unique index (enrollmentId, classSessionId) WHERE
   * "deletedAt" IS NULL — re-POSTing the same payload updates, never
   * duplicates. Deliberately NO $transaction: N independent atomic writes
   * (pgbouncer transaction-pooling constraint; the derived balance removes any
   * need for write atomicity across rows).
   */
  async recordSession(classSessionId: string, dto: RecordSessionAttendanceDto, user: RequestUser) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, deletedAt: null },
      select: { id: true, classId: true, status: true, date: true, endTime: true },
    });
    if (!session) throw new NotFoundException("Buổi học không tồn tại");

    // D4 writable-status matrix (approved): PLANNED ❌ · ONGOING ✅create+update ·
    // COMPLETED update-existing-only (enforced per row below) · CANCELLED ❌.
    if (session.status === "PLANNED") {
      throw new BadRequestException("Buổi học chưa bắt đầu, không thể điểm danh");
    }
    if (session.status === "CANCELLED") {
      throw new BadRequestException("Buổi học đã hủy, không thể điểm danh");
    }

    const enrollmentIds = dto.records.map((r) => r.enrollmentId);
    if (new Set(enrollmentIds).size !== enrollmentIds.length) {
      throw new BadRequestException("Danh sách điểm danh chứa đăng ký học bị trùng lặp");
    }

    // Roster = ACTIVE enrollments of the session's class.
    const roster = await this.prisma.enrollment.findMany({
      where: { classId: session.classId, status: "ACTIVE", deletedAt: null },
      select: {
        id: true,
        student: { select: { status: true, deletedAt: true } },
      },
    });
    const rosterById = new Map(roster.map((e) => [e.id, e]));

    for (const record of dto.records) {
      const enrollment = rosterById.get(record.enrollmentId);
      if (!enrollment) {
        throw new BadRequestException(
          "Danh sách điểm danh chứa đăng ký học không thuộc lớp của buổi học này"
        );
      }
      if (enrollment.student.deletedAt !== null || enrollment.student.status !== "ACTIVE") {
        throw new BadRequestException("Học sinh không hoạt động, không thể điểm danh");
      }
    }

    for (const record of dto.records) {
      await this.writeRecord(session as SessionForRecording, record, user);
    }

    return this.attendanceRepository.findBySession(classSessionId);
  }

  private async writeRecord(
    session: SessionForRecording,
    record: AttendanceRecordItemDto,
    user: RequestUser
  ) {
    const existing = await this.attendanceRepository.findActiveByEnrollmentAndSession(
      record.enrollmentId,
      session.id
    );
    if (existing) {
      await this.applyBulkUpdate(session, existing, record, user);
      return;
    }

    // D4 (cross-review correction 2): a COMPLETED session accepts corrections
    // of existing rows only — never new rows. A new row on a past session
    // would instantly consume a lesson via the derived count; backfilling onto
    // completed sessions is deliberately impossible (mid-cycle enrollment is
    // Slice #2's question, not an accident here).
    if (session.status === "COMPLETED") {
      throw new BadRequestException(
        "Buổi học đã hoàn thành, chỉ có thể sửa các điểm danh đã ghi nhận"
      );
    }

    try {
      const created = await this.attendanceRepository.create({
        enrollment: { connect: { id: record.enrollmentId } },
        classSession: { connect: { id: session.id } },
        status: record.status,
        ...(record.note !== undefined && { note: record.note }),
        markedBy: { connect: { id: user.id } },
      });
      await this.auditLogs.log({
        userId: user.id,
        action: "CREATE",
        entity: "Attendance",
        entityId: created.id,
        metadata: {
          after: {
            enrollmentId: record.enrollmentId,
            classSessionId: session.id,
            status: record.status,
            note: record.note ?? null,
          },
        },
      });
    } catch (err) {
      // The partial-unique index cannot be targeted by prisma.upsert, so a
      // concurrent create for the same (enrollmentId, classSessionId) races us
      // and the loser hits P2002 — convert it to a re-read + update (same
      // recovery idea as the employee-code P2002 retry). Idempotency itself
      // comes from the DB index, not from this client mechanism.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const winner = await this.attendanceRepository.findActiveByEnrollmentAndSession(
          record.enrollmentId,
          session.id
        );
        if (!winner) throw err;
        await this.applyBulkUpdate(session, winner, record, user);
        return;
      }
      throw err;
    }
  }

  private async applyBulkUpdate(
    session: SessionForRecording,
    existing: AttendanceRecord,
    record: AttendanceRecordItemDto,
    user: RequestUser
  ) {
    const statusChanged = record.status !== existing.status;
    const noteChanged = record.note !== undefined && record.note !== existing.note;
    // Idempotent re-POST of the same payload: nothing changed → no write, no audit.
    if (!statusChanged && !noteChanged) return;

    this.assertCorrectionWindow(session, user);

    await this.attendanceRepository.update(existing.id, {
      status: record.status,
      ...(record.note !== undefined && { note: record.note }),
      markedBy: { connect: { id: user.id } },
    });

    const metadata: Record<string, { from: string | null; to: string | null }> = {};
    if (statusChanged) metadata.status = { from: existing.status, to: record.status };
    if (noteChanged) metadata.note = { from: existing.note, to: record.note ?? null };
    await this.auditLogs.log({
      userId: user.id,
      action: "UPDATE",
      entity: "Attendance",
      entityId: existing.id,
      metadata,
    });
  }

  /**
   * PATCH /attendance/:id — correction of evidence (status/note only). Never a
   * delete path; corrections to a non-deducting status need no reversal logic
   * (the derived COUNT simply stops including the row). Follows the 48h /
   * `attendance.correct` rules regardless of session status (approved D4).
   */
  async correct(id: string, dto: CorrectAttendanceDto, user: RequestUser) {
    const existing = await this.attendanceRepository.findById(id);
    if (!existing) throw new NotFoundException("Điểm danh không tồn tại");

    this.assertCorrectionWindow(existing.classSession, user);

    const updated = await this.attendanceRepository.update(id, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.note !== undefined && { note: dto.note }),
      markedBy: { connect: { id: user.id } },
    });

    const metadata: Record<string, { from: string | null; to: string | null }> = {};
    if (dto.status !== undefined && dto.status !== existing.status) {
      metadata.status = { from: existing.status, to: dto.status };
    }
    if (dto.note !== undefined && dto.note !== existing.note) {
      metadata.note = { from: existing.note, to: dto.note };
    }
    await this.auditLogs.log({
      userId: user.id,
      action: "UPDATE",
      entity: "Attendance",
      entityId: id,
      ...(Object.keys(metadata).length > 0 && { metadata }),
    });

    return updated;
  }

  /**
   * SessionCompletionPolicy implementation (E1): ONGOING → COMPLETED is
   * blocked until every ACTIVE enrollment of the session's class has a
   * non-deleted attendance row for this session. Any recorded status —
   * including EXCUSED — is finalized. A roster with 0 ACTIVE enrollments is
   * trivially completable.
   */
  async assertSessionCompletable(classSessionId: string): Promise<void> {
    const session = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, deletedAt: null },
      select: { id: true, classId: true },
    });
    if (!session) throw new NotFoundException("Buổi học không tồn tại");

    const unmarked = await this.prisma.enrollment.count({
      where: {
        classId: session.classId,
        status: "ACTIVE",
        deletedAt: null,
        attendances: { none: { classSessionId, deletedAt: null } },
      },
    });

    if (unmarked > 0) {
      throw new BadRequestException(
        `Không thể hoàn thành buổi học: còn ${unmarked} học viên chưa được điểm danh`
      );
    }
  }
}
