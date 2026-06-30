import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const SUBJECT_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  color: true,
  icon: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubjectSelect;

export type SubjectRecord = Prisma.SubjectGetPayload<{ select: typeof SUBJECT_SELECT }>;

@Injectable()
export class SubjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.SubjectWhereInput;
    orderBy: Prisma.SubjectOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<SubjectRecord[]> {
    return this.prisma.subject.findMany({
      where: params.where,
      select: SUBJECT_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.SubjectWhereInput): Promise<number> {
    return this.prisma.subject.count({ where });
  }

  async findById(id: string, tx?: Tx): Promise<SubjectRecord | null> {
    return (tx ?? this.prisma).subject.findFirst({
      where: { id, deletedAt: null },
      select: SUBJECT_SELECT,
    });
  }

  async findByCode(code: string, excludeId?: string): Promise<SubjectRecord | null> {
    return this.prisma.subject.findFirst({
      where: {
        code,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: SUBJECT_SELECT,
    });
  }

  async create(data: Prisma.SubjectCreateInput, tx?: Tx): Promise<SubjectRecord> {
    return (tx ?? this.prisma).subject.create({ data, select: SUBJECT_SELECT });
  }

  async update(id: string, data: Prisma.SubjectUpdateInput, tx?: Tx): Promise<SubjectRecord> {
    return (tx ?? this.prisma).subject.update({ where: { id }, data, select: SUBJECT_SELECT });
  }

  async softDelete(id: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
