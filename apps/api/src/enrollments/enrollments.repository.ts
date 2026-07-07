import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const ENROLLMENT_SELECT = {
  id: true,
  studentId: true,
  classId: true,
  status: true,
  joinedAt: true,
  billingCycleSessions: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  student: { select: { id: true, code: true, firstName: true, lastName: true, status: true } },
  class: {
    select: {
      id: true,
      code: true,
      name: true,
      capacity: true,
      sessionCount: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  },
} satisfies Prisma.EnrollmentSelect;

export type EnrollmentRecord = Prisma.EnrollmentGetPayload<{ select: typeof ENROLLMENT_SELECT }>;

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.EnrollmentWhereInput;
    orderBy: Prisma.EnrollmentOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<EnrollmentRecord[]> {
    return this.prisma.enrollment.findMany({
      where: params.where,
      select: ENROLLMENT_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.EnrollmentWhereInput): Promise<number> {
    return this.prisma.enrollment.count({ where });
  }

  async findById(id: string, tx?: Tx): Promise<EnrollmentRecord | null> {
    return (tx ?? this.prisma).enrollment.findFirst({
      where: { id, deletedAt: null },
      select: ENROLLMENT_SELECT,
    });
  }

  async countActive(classId: string, excludeId?: string, tx?: Tx): Promise<number> {
    return (tx ?? this.prisma).enrollment.count({
      where: {
        classId,
        status: "ACTIVE",
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
  }

  async findActiveForStudentAndClass(
    studentId: string,
    classId: string,
    excludeId?: string,
    tx?: Tx
  ): Promise<{ id: string } | null> {
    return (tx ?? this.prisma).enrollment.findFirst({
      where: {
        studentId,
        classId,
        status: "ACTIVE",
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
  }

  async create(data: Prisma.EnrollmentCreateInput, tx?: Tx): Promise<EnrollmentRecord> {
    return (tx ?? this.prisma).enrollment.create({ data, select: ENROLLMENT_SELECT });
  }

  async update(id: string, data: Prisma.EnrollmentUpdateInput, tx?: Tx): Promise<EnrollmentRecord> {
    return (tx ?? this.prisma).enrollment.update({
      where: { id },
      data,
      select: ENROLLMENT_SELECT,
    });
  }

  async softDelete(id: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).enrollment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
