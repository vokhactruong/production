import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ClassSessionsRepository } from "../class-sessions/class-sessions.repository";
import {
  ClassSchedulesRepository,
  ClassScheduleRecord,
} from "../class-schedules/class-schedules.repository";

type TheoreticalSlot = { date: Date; startTime: Date; endTime: Date };

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Walks forward day-by-day from Class.startDate, collecting one slot per
 * matching weekday (in schedule order, for classes with multiple slots on the
 * same weekday) until `sessionCount` theoretical sessions have been produced.
 * This is the single source of truth for "what dates should this Class meet
 * on" — both generateInitialSessions and syncMissingSessions call it, so the
 * two never disagree about the theoretical schedule.
 */
function computeTheoreticalSessions(
  startDate: Date,
  schedules: ClassScheduleRecord[],
  sessionCount: number
): TheoreticalSlot[] {
  if (schedules.length === 0 || sessionCount <= 0) return [];

  const sorted = [...schedules].sort(
    (a, b) => a.weekday - b.weekday || a.startTime.getTime() - b.startTime.getTime()
  );

  const result: TheoreticalSlot[] = [];
  const cursor = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  );
  const MAX_DAYS = 3650; // 10-year safety cap so a pathological input can't hang the request
  let daysWalked = 0;

  while (result.length < sessionCount && daysWalked < MAX_DAYS) {
    const weekday = cursor.getUTCDay();
    for (const slot of sorted) {
      if (slot.weekday !== weekday) continue;
      if (result.length >= sessionCount) break;
      result.push({ date: new Date(cursor), startTime: slot.startTime, endTime: slot.endTime });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    daysWalked++;
  }

  return result;
}

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classSessionsRepository: ClassSessionsRepository,
    private readonly classSchedulesRepository: ClassSchedulesRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  private async getClass(classId: string) {
    const classEntity = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      select: { id: true, status: true, startDate: true, sessionCount: true },
    });
    if (!classEntity) throw new NotFoundException("Lớp học không tồn tại");
    return classEntity;
  }

  async generateInitialSessions(classId: string, actorId?: string) {
    const classEntity = await this.getClass(classId);
    if (classEntity.status !== "OPEN") {
      throw new BadRequestException(
        "Chỉ có thể tạo buổi học ban đầu khi lớp học đang ở trạng thái Đang mở"
      );
    }

    const existingCount = await this.classSessionsRepository.countForClass(classId);
    if (existingCount > 0) {
      throw new ConflictException(
        "Lớp học đã có buổi học. Vui lòng dùng chức năng đồng bộ để thêm buổi học mới."
      );
    }

    const schedules = await this.classSchedulesRepository.findAllForClass(classId);
    if (schedules.length === 0) {
      throw new BadRequestException("Lớp học chưa có lịch học. Vui lòng thiết lập lịch học trước.");
    }

    const theoretical = computeTheoreticalSessions(
      classEntity.startDate,
      schedules,
      classEntity.sessionCount
    );

    const startNumber = (await this.classSessionsRepository.findMaxSessionNumber(classId)) + 1;
    const ops = theoretical.map((slot, i) =>
      this.classSessionsRepository.buildCreateOp({
        class: { connect: { id: classId } },
        sessionNumber: startNumber + i,
        status: "PLANNED",
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    );

    await this.runBatch(ops);
    await this.auditLogs.log({
      userId: actorId,
      action: "GENERATE_SESSIONS",
      entity: "Class",
      entityId: classId,
      metadata: { generatedCount: theoretical.length },
    });

    return {
      generatedCount: theoretical.length,
      existingCount: 0,
      totalSessions: theoretical.length,
    };
  }

  async syncMissingSessions(classId: string, actorId?: string) {
    const classEntity = await this.getClass(classId);
    if (classEntity.status !== "OPEN") {
      throw new BadRequestException(
        "Chỉ có thể đồng bộ buổi học khi lớp học đang ở trạng thái Đang mở"
      );
    }

    const schedules = await this.classSchedulesRepository.findAllForClass(classId);
    if (schedules.length === 0) {
      throw new BadRequestException("Lớp học chưa có lịch học. Vui lòng thiết lập lịch học trước.");
    }

    const existingDates = await this.classSessionsRepository.findActiveDatesForClass(classId);
    const existingCount = existingDates.length;
    const existingKeys = new Set(existingDates.map(dateKey));

    const remainingCapacity = classEntity.sessionCount - existingCount;
    if (remainingCapacity <= 0) {
      return { generatedCount: 0, existingCount, totalSessions: existingCount };
    }

    const theoretical = computeTheoreticalSessions(
      classEntity.startDate,
      schedules,
      classEntity.sessionCount
    );
    const today = todayUtcMidnight();

    // Only ever append missing FUTURE sessions — sync never backfills a date
    // that has already passed, and never touches a date that already has a
    // session (generated or manually created), satisfying "never overwrite
    // existing Sessions" and "never recreate soft-deleted Sessions" (a
    // soft-deleted session's date is absent from existingKeys, but if that
    // date is in the past it's still skipped by the `>= today` guard; if it's
    // in the future, re-creating it is the intended "fill the gap" behavior).
    const missing = theoretical.filter(
      (slot) => !existingKeys.has(dateKey(slot.date)) && slot.date >= today
    );
    const toCreate = missing.slice(0, remainingCapacity);

    if (toCreate.length === 0) {
      return { generatedCount: 0, existingCount, totalSessions: existingCount };
    }

    const startNumber = (await this.classSessionsRepository.findMaxSessionNumber(classId)) + 1;
    const ops = toCreate.map((slot, i) =>
      this.classSessionsRepository.buildCreateOp({
        class: { connect: { id: classId } },
        sessionNumber: startNumber + i,
        status: "PLANNED",
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    );

    await this.runBatch(ops);
    await this.auditLogs.log({
      userId: actorId,
      action: "SYNC_SESSIONS",
      entity: "Class",
      entityId: classId,
      metadata: { generatedCount: toCreate.length },
    });

    return {
      generatedCount: toCreate.length,
      existingCount,
      totalSessions: existingCount + toCreate.length,
    };
  }

  // Array-form `$transaction([...])`, not the interactive callback form: this
  // batches all inserts into one DB round trip and is compatible with this
  // app's pooled DATABASE_URL (pgbouncer transaction mode) — the interactive
  // form previously caused a production "Transaction not found" incident on
  // ClassesService under the same connection pooler.
  private async runBatch<T>(ops: Prisma.PrismaPromise<T>[]) {
    try {
      return await this.prisma.$transaction(ops);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Đã có buổi học trùng lặp được tạo. Vui lòng thử lại.");
      }
      throw err;
    }
  }
}
