import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const CLASSROOM_SELECT = {
  id: true,
  code: true,
  name: true,
  type: true,
  capacity: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClassroomSelect;

export type ClassroomRecord = Prisma.ClassroomGetPayload<{ select: typeof CLASSROOM_SELECT }>;

@Injectable()
export class ClassroomsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.ClassroomWhereInput;
    orderBy: Prisma.ClassroomOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<ClassroomRecord[]> {
    return this.prisma.classroom.findMany({
      where: params.where,
      select: CLASSROOM_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.ClassroomWhereInput): Promise<number> {
    return this.prisma.classroom.count({ where });
  }

  async findById(id: string, tx?: Tx): Promise<ClassroomRecord | null> {
    return (tx ?? this.prisma).classroom.findFirst({
      where: { id, deletedAt: null },
      select: CLASSROOM_SELECT,
    });
  }

  async findByCode(code: string, excludeId?: string): Promise<ClassroomRecord | null> {
    return this.prisma.classroom.findFirst({
      where: { code, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
      select: CLASSROOM_SELECT,
    });
  }

  async create(data: Prisma.ClassroomCreateInput, tx?: Tx): Promise<ClassroomRecord> {
    return (tx ?? this.prisma).classroom.create({ data, select: CLASSROOM_SELECT });
  }

  async update(id: string, data: Prisma.ClassroomUpdateInput, tx?: Tx): Promise<ClassroomRecord> {
    return (tx ?? this.prisma).classroom.update({
      where: { id },
      data,
      select: CLASSROOM_SELECT,
    });
  }

  async softDelete(id: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).classroom.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
