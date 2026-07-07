import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ClassSchedulesRepository } from "./class-schedules.repository";
import {
  CreateClassScheduleDto,
  UpdateClassScheduleDto,
  ClassScheduleQueryDto,
} from "./dto/class-schedule.dto";

export function toTimeDate(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

export function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

@Injectable()
export class ClassSchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classSchedulesRepository: ClassSchedulesRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  private async assertEditableClass(classId: string) {
    const classEntity = await this.prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!classEntity) throw new BadRequestException("Lớp học không tồn tại");
    if (classEntity.status === "COMPLETED") {
      throw new BadRequestException("Lớp học đã hoàn thành, lịch học đã bị khóa");
    }
    if (classEntity.status === "CANCELLED") {
      throw new BadRequestException("Lớp học đã hủy, lịch học đã bị khóa");
    }
    return classEntity;
  }

  private assertValidTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu");
  }

  async findAll(query: ClassScheduleQueryDto) {
    if (!query.classId) return [];
    return this.classSchedulesRepository.findAllForClass(query.classId);
  }

  async findOne(id: string) {
    const schedule = await this.classSchedulesRepository.findById(id);
    if (!schedule) throw new NotFoundException("Lịch học không tồn tại");
    return schedule;
  }

  async create(dto: CreateClassScheduleDto, actorId?: string) {
    this.assertValidTimeRange(dto.startTime, dto.endTime);
    await this.assertEditableClass(dto.classId);

    const startTime = toTimeDate(dto.startTime);
    const duplicate = await this.classSchedulesRepository.findActiveSlot(
      dto.classId,
      dto.weekday,
      startTime
    );
    if (duplicate) {
      throw new ConflictException("Khung giờ này đã tồn tại trong lịch học của lớp");
    }

    try {
      const created = await this.classSchedulesRepository.create({
        class: { connect: { id: dto.classId } },
        weekday: dto.weekday,
        startTime,
        endTime: toTimeDate(dto.endTime),
      });
      await this.auditLogs.log({
        userId: actorId,
        action: "CREATE",
        entity: "ClassSchedule",
        entityId: created.id,
      });
      return created;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Khung giờ này đã tồn tại trong lịch học của lớp");
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateClassScheduleDto, actorId?: string) {
    const existing = await this.classSchedulesRepository.findById(id);
    if (!existing) throw new NotFoundException("Lịch học không tồn tại");
    await this.assertEditableClass(existing.classId);

    const nextWeekday = dto.weekday ?? existing.weekday;
    const nextStartTime = dto.startTime ?? formatTime(existing.startTime);
    const nextEndTime = dto.endTime ?? formatTime(existing.endTime);
    this.assertValidTimeRange(nextStartTime, nextEndTime);

    if (dto.weekday !== undefined || dto.startTime !== undefined) {
      const duplicate = await this.classSchedulesRepository.findActiveSlot(
        existing.classId,
        nextWeekday,
        toTimeDate(nextStartTime),
        id
      );
      if (duplicate) {
        throw new ConflictException("Khung giờ này đã tồn tại trong lịch học của lớp");
      }
    }

    try {
      const updated = await this.classSchedulesRepository.update(id, {
        ...(dto.weekday !== undefined && { weekday: dto.weekday }),
        ...(dto.startTime !== undefined && { startTime: toTimeDate(dto.startTime) }),
        ...(dto.endTime !== undefined && { endTime: toTimeDate(dto.endTime) }),
      });
      await this.auditLogs.log({
        userId: actorId,
        action: "UPDATE",
        entity: "ClassSchedule",
        entityId: id,
      });
      return updated;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Khung giờ này đã tồn tại trong lịch học của lớp");
      }
      throw err;
    }
  }

  async remove(id: string, actorId?: string) {
    const existing = await this.classSchedulesRepository.findById(id);
    if (!existing) throw new NotFoundException("Lịch học không tồn tại");
    await this.assertEditableClass(existing.classId);

    await this.classSchedulesRepository.softDelete(id);
    await this.auditLogs.log({
      userId: actorId,
      action: "DELETE",
      entity: "ClassSchedule",
      entityId: id,
    });

    return { message: "Xóa lịch học thành công" };
  }
}
