import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const STUDENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  email: true,
  avatar: true,
  address: true,
  guardianName: true,
  guardianPhone: true,
  guardianEmail: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StudentSelect;

export type StudentRecord = Prisma.StudentGetPayload<{ select: typeof STUDENT_SELECT }>;

@Injectable()
export class StudentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.StudentWhereInput;
    orderBy: Prisma.StudentOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<StudentRecord[]> {
    return this.prisma.student.findMany({
      where: params.where,
      select: STUDENT_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.StudentWhereInput): Promise<number> {
    return this.prisma.student.count({ where });
  }

  async findById(id: string): Promise<StudentRecord | null> {
    return this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      select: STUDENT_SELECT,
    });
  }

  async findByEmail(email: string, excludeId?: string): Promise<StudentRecord | null> {
    return this.prisma.student.findFirst({
      where: { email, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: STUDENT_SELECT,
    });
  }

  async findByPhone(phone: string, excludeId?: string): Promise<StudentRecord | null> {
    return this.prisma.student.findFirst({
      where: { phone, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: STUDENT_SELECT,
    });
  }

  async create(data: Prisma.StudentCreateInput): Promise<StudentRecord> {
    return this.prisma.student.create({ data, select: STUDENT_SELECT });
  }

  async update(id: string, data: Prisma.StudentUpdateInput): Promise<StudentRecord> {
    return this.prisma.student.update({ where: { id }, data, select: STUDENT_SELECT });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
