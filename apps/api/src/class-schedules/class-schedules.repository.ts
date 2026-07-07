import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const CLASS_SCHEDULE_SELECT = {
  id: true,
  classId: true,
  weekday: true,
  startTime: true,
  endTime: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClassScheduleSelect;

export type ClassScheduleRecord = Prisma.ClassScheduleGetPayload<{
  select: typeof CLASS_SCHEDULE_SELECT;
}>;

@Injectable()
export class ClassSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForClass(classId: string): Promise<ClassScheduleRecord[]> {
    return this.prisma.classSchedule.findMany({
      where: { classId, deletedAt: null },
      select: CLASS_SCHEDULE_SELECT,
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
  }

  async findById(id: string): Promise<ClassScheduleRecord | null> {
    return this.prisma.classSchedule.findFirst({
      where: { id, deletedAt: null },
      select: CLASS_SCHEDULE_SELECT,
    });
  }

  async findActiveSlot(
    classId: string,
    weekday: number,
    startTime: Date,
    excludeId?: string
  ): Promise<ClassScheduleRecord | null> {
    return this.prisma.classSchedule.findFirst({
      where: {
        classId,
        weekday,
        startTime,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: CLASS_SCHEDULE_SELECT,
    });
  }

  async create(data: Prisma.ClassScheduleCreateInput): Promise<ClassScheduleRecord> {
    return this.prisma.classSchedule.create({ data, select: CLASS_SCHEDULE_SELECT });
  }

  async update(id: string, data: Prisma.ClassScheduleUpdateInput): Promise<ClassScheduleRecord> {
    return this.prisma.classSchedule.update({ where: { id }, data, select: CLASS_SCHEDULE_SELECT });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.classSchedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
