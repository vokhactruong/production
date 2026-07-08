import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const ATTENDANCE_SELECT = {
  id: true,
  enrollmentId: true,
  classSessionId: true,
  status: true,
  note: true,
  markedById: true,
  createdAt: true,
  updatedAt: true,
  enrollment: {
    select: {
      id: true,
      studentId: true,
      classId: true,
      status: true,
      billingCycleSessions: true,
      student: { select: { id: true, code: true, firstName: true, lastName: true, status: true } },
    },
  },
  classSession: {
    select: {
      id: true,
      classId: true,
      sessionNumber: true,
      status: true,
      date: true,
      startTime: true,
      endTime: true,
    },
  },
  markedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.AttendanceSelect;

export type AttendanceRecord = Prisma.AttendanceGetPayload<{ select: typeof ATTENDANCE_SELECT }>;

// No softDelete() and no delete path here on purpose: attendance is
// participation evidence — corrections only, never deletes (approved business
// rule). The (enrollmentId, classSessionId) uniqueness is a partial index in
// raw migration SQL (WHERE "deletedAt" IS NULL), not a Prisma DSL unique, so
// writers must use findActiveByEnrollmentAndSession → create/update and treat
// P2002 as "a concurrent create won the race" (re-read + update) — never
// prisma.upsert.
@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.AttendanceWhereInput;
    orderBy: Prisma.AttendanceOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<AttendanceRecord[]> {
    return this.prisma.attendance.findMany({
      where: params.where,
      select: ATTENDANCE_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.AttendanceWhereInput): Promise<number> {
    return this.prisma.attendance.count({ where });
  }

  async findById(id: string): Promise<AttendanceRecord | null> {
    return this.prisma.attendance.findFirst({
      where: { id, deletedAt: null },
      select: ATTENDANCE_SELECT,
    });
  }

  async findBySession(classSessionId: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendance.findMany({
      where: { classSessionId, deletedAt: null },
      select: ATTENDANCE_SELECT,
      orderBy: { createdAt: "asc" },
    });
  }

  async findActiveByEnrollmentAndSession(
    enrollmentId: string,
    classSessionId: string
  ): Promise<AttendanceRecord | null> {
    return this.prisma.attendance.findFirst({
      where: { enrollmentId, classSessionId, deletedAt: null },
      select: ATTENDANCE_SELECT,
    });
  }

  async create(data: Prisma.AttendanceCreateInput): Promise<AttendanceRecord> {
    return this.prisma.attendance.create({ data, select: ATTENDANCE_SELECT });
  }

  async update(id: string, data: Prisma.AttendanceUpdateInput): Promise<AttendanceRecord> {
    return this.prisma.attendance.update({
      where: { id },
      data,
      select: ATTENDANCE_SELECT,
    });
  }
}
