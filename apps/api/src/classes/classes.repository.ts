import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const CLASS_SELECT = {
  id: true,
  code: true,
  name: true,
  courseId: true,
  subjectId: true,
  classroomId: true,
  employeeId: true,
  status: true,
  capacity: true,
  sessionCount: true,
  startDate: true,
  endDate: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  course: { select: { id: true, code: true, name: true } },
  subject: { select: { id: true, code: true, name: true } },
  classroom: { select: { id: true, code: true, name: true } },
  employee: { select: { id: true, code: true, firstName: true, lastName: true } },
} satisfies Prisma.ClassSelect;

export type ClassRecord = Prisma.ClassGetPayload<{ select: typeof CLASS_SELECT }>;

@Injectable()
export class ClassesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.ClassWhereInput;
    orderBy: Prisma.ClassOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<ClassRecord[]> {
    return this.prisma.class.findMany({
      where: params.where,
      select: CLASS_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.ClassWhereInput): Promise<number> {
    return this.prisma.class.count({ where });
  }

  async findById(id: string, tx?: Tx): Promise<ClassRecord | null> {
    return (tx ?? this.prisma).class.findFirst({
      where: { id, deletedAt: null },
      select: CLASS_SELECT,
    });
  }

  async findByCode(code: string, excludeId?: string): Promise<ClassRecord | null> {
    return this.prisma.class.findFirst({
      where: { code, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: CLASS_SELECT,
    });
  }

  async create(data: Prisma.ClassCreateInput, tx?: Tx): Promise<ClassRecord> {
    return (tx ?? this.prisma).class.create({ data, select: CLASS_SELECT });
  }

  async update(id: string, data: Prisma.ClassUpdateInput, tx?: Tx): Promise<ClassRecord> {
    return (tx ?? this.prisma).class.update({ where: { id }, data, select: CLASS_SELECT });
  }

  async softDelete(id: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
