import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ClassSessionsRepository } from "./class-sessions.repository";
import { SESSION_COMPLETION_POLICY, SessionCompletionPolicy } from "./session-completion.policy";
import { UpdateClassSessionDto, ClassSessionQueryDto } from "./dto/class-session.dto";

type ClassSessionStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";

const ALLOWED_TRANSITIONS: Record<ClassSessionStatus, ClassSessionStatus[]> = {
  PLANNED: ["ONGOING", "CANCELLED"],
  ONGOING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

function toTimeDate(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

@Injectable()
export class ClassSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classSessionsRepository: ClassSessionsRepository,
    private readonly auditLogs: AuditLogsService,
    // Business Policy Interface (D1): completion knows only "a policy must
    // pass" — it never names Attendance. The provider behind this token lives
    // in whichever module owns the policy today.
    @Inject(SESSION_COMPLETION_POLICY)
    private readonly sessionCompletionPolicy: SessionCompletionPolicy
  ) {}

  private assertValidTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu");
  }

  private assertDateWithinClassPeriod(date: string, bounds: { startDate: Date; endDate: Date }) {
    const d = new Date(date);
    if (d < bounds.startDate) {
      throw new BadRequestException("Ngày học phải sau hoặc bằng ngày bắt đầu lớp học");
    }
    if (d > bounds.endDate) {
      throw new BadRequestException("Ngày học phải trước hoặc bằng ngày kết thúc lớp học");
    }
  }

  private assertValidTransition(current: ClassSessionStatus, next: ClassSessionStatus) {
    if (current === next) return;
    if (!ALLOWED_TRANSITIONS[current].includes(next)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái buổi học từ ${current} sang ${next}`
      );
    }
  }

  private buildSearchConditions(search: string): Prisma.ClassSessionWhereInput[] {
    const mode = "insensitive" as const;
    return [
      { topic: { contains: search, mode } },
      { note: { contains: search, mode } },
      { class: { is: { name: { contains: search, mode } } } },
      { class: { is: { code: { contains: search, mode } } } },
    ];
  }

  async findAll(query: ClassSessionQueryDto) {
    const {
      search,
      classId,
      status,
      date,
      sortBy = "date",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClassSessionWhereInput = {
      deletedAt: null,
      ...(classId && { classId }),
      ...(status && { status }),
      ...(date && { date: new Date(date) }),
      ...(search && { OR: this.buildSearchConditions(search) }),
    };

    const [items, total] = await Promise.all([
      this.classSessionsRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.classSessionsRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const session = await this.classSessionsRepository.findById(id);
    if (!session) throw new NotFoundException("Buổi học không tồn tại");
    return session;
  }

  // No manual create(): ClassSession is now generated business data, produced
  // only by SchedulingService.generateInitialSessions / syncMissingSessions.
  // Manual adjustments are limited to update() below (date/status/topic/note).

  async update(id: string, dto: UpdateClassSessionDto, actorId?: string) {
    const existing = await this.classSessionsRepository.findById(id);
    if (!existing) throw new NotFoundException("Buổi học không tồn tại");

    const nextStartTime = dto.startTime ?? formatTime(existing.startTime);
    const nextEndTime = dto.endTime ?? formatTime(existing.endTime);
    if (dto.startTime !== undefined || dto.endTime !== undefined) {
      this.assertValidTimeRange(nextStartTime, nextEndTime);
    }

    if (dto.date !== undefined) {
      const classEntity = await this.prisma.class.findFirst({
        where: { id: existing.classId },
        select: { startDate: true, endDate: true },
      });
      this.assertDateWithinClassPeriod(dto.date, classEntity!);
    }

    if (dto.status !== undefined) {
      this.assertValidTransition(existing.status, dto.status);
      // E1 gate: completing a session requires its attendance roster to be
      // finalized (every ACTIVE enrollment marked; EXCUSED counts). Only the
      // actual transition is gated — a no-op COMPLETED → COMPLETED PATCH is
      // not re-checked. NO consumption code runs here: the derived balance
      // means the session BEING COMPLETED is what makes its deducting
      // attendance rows count.
      if (dto.status === "COMPLETED" && existing.status !== "COMPLETED") {
        await this.sessionCompletionPolicy.assertSessionCompletable(id);
      }
    }

    // No $transaction here: single-entity update + its audit log (see
    // DATABASE.md, "Never use transactions for simple CRUD"). Prisma
    // interactive transactions are also unreliable over this app's pooled
    // DATABASE_URL (pgbouncer transaction-pooling mode can recycle the
    // underlying connection between statements) — this previously caused a
    // production "Transaction not found" incident on ClassesService.
    const updated = await this.classSessionsRepository.update(id, {
      ...(dto.date !== undefined && { date: new Date(dto.date) }),
      ...(dto.startTime !== undefined && { startTime: toTimeDate(dto.startTime) }),
      ...(dto.endTime !== undefined && { endTime: toTimeDate(dto.endTime) }),
      ...(dto.topic !== undefined && { topic: dto.topic }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    const metadata: Record<string, { from: string; to: string }> = {};
    if (dto.status !== undefined && dto.status !== existing.status) {
      metadata.status = { from: existing.status, to: dto.status };
    }
    if (dto.date !== undefined) {
      const oldIso = existing.date.toISOString();
      const newIso = new Date(dto.date).toISOString();
      if (oldIso !== newIso) metadata.date = { from: oldIso, to: newIso };
    }
    if (dto.startTime !== undefined) {
      const oldStart = formatTime(existing.startTime);
      if (dto.startTime !== oldStart) metadata.startTime = { from: oldStart, to: dto.startTime };
    }
    if (dto.endTime !== undefined) {
      const oldEnd = formatTime(existing.endTime);
      if (dto.endTime !== oldEnd) metadata.endTime = { from: oldEnd, to: dto.endTime };
    }

    await this.auditLogs.log({
      userId: actorId,
      action: "UPDATE",
      entity: "ClassSession",
      entityId: id,
      ...(Object.keys(metadata).length > 0 && { metadata }),
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const existing = await this.classSessionsRepository.findById(id);
    if (!existing) throw new NotFoundException("Buổi học không tồn tại");

    if (existing.status === "ONGOING" || existing.status === "COMPLETED") {
      throw new ConflictException(
        "Chỉ có thể xóa buổi học ở trạng thái Đã lên kế hoạch hoặc Đã hủy"
      );
    }

    // No $transaction here — see the comment in update() above.
    await this.classSessionsRepository.softDelete(id);
    await this.auditLogs.log({
      userId: actorId,
      action: "DELETE",
      entity: "ClassSession",
      entityId: id,
    });

    return { message: "Xóa buổi học thành công" };
  }
}
