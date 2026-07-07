import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const CLASS_SESSION_SELECT = {
  id: true,
  classId: true,
  sessionNumber: true,
  status: true,
  date: true,
  startTime: true,
  endTime: true,
  topic: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  class: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      employee: { select: { id: true, firstName: true, lastName: true } },
      classroom: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ClassSessionSelect;

export type ClassSessionRecord = Prisma.ClassSessionGetPayload<{
  select: typeof CLASS_SESSION_SELECT;
}>;

@Injectable()
export class ClassSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.ClassSessionWhereInput;
    orderBy: Prisma.ClassSessionOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<ClassSessionRecord[]> {
    return this.prisma.classSession.findMany({
      where: params.where,
      select: CLASS_SESSION_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async count(where: Prisma.ClassSessionWhereInput): Promise<number> {
    return this.prisma.classSession.count({ where });
  }

  async findById(id: string, tx?: Tx): Promise<ClassSessionRecord | null> {
    return (tx ?? this.prisma).classSession.findFirst({
      where: { id, deletedAt: null },
      select: CLASS_SESSION_SELECT,
    });
  }

  async countForClass(classId: string, tx?: Tx): Promise<number> {
    return (tx ?? this.prisma).classSession.count({
      where: { classId, deletedAt: null },
    });
  }

  async findMaxSessionNumber(classId: string, tx?: Tx): Promise<number> {
    // sessionNumber is a business identifier and must never be reused, so this
    // intentionally includes soft-deleted rows — unlike every other query in
    // this repository, which filters deletedAt: null.
    const result = await (tx ?? this.prisma).classSession.aggregate({
      where: { classId },
      _max: { sessionNumber: true },
    });
    return result._max.sessionNumber ?? 0;
  }

  async create(data: Prisma.ClassSessionCreateInput, tx?: Tx): Promise<ClassSessionRecord> {
    return (tx ?? this.prisma).classSession.create({ data, select: CLASS_SESSION_SELECT });
  }

  /**
   * Returns an un-awaited Prisma create operation, for batching multiple
   * session creations into a single array-form `$transaction([...])` call —
   * used by SchedulingService for bulk generation. The array form (as opposed
   * to the interactive `$transaction(async (tx) => ...)` callback form) is
   * compatible with this app's pooled DATABASE_URL (pgbouncer transaction
   * mode), which cannot reliably hold an interactive transaction open across
   * many sequential statements — see the ClassesService fix for the
   * production incident this caused.
   */
  buildCreateOp(data: Prisma.ClassSessionCreateInput) {
    return this.prisma.classSession.create({ data, select: CLASS_SESSION_SELECT });
  }

  async findActiveDatesForClass(classId: string): Promise<Date[]> {
    const rows = await this.prisma.classSession.findMany({
      where: { classId, deletedAt: null },
      select: { date: true },
    });
    return rows.map((r) => r.date);
  }

  async update(
    id: string,
    data: Prisma.ClassSessionUpdateInput,
    tx?: Tx
  ): Promise<ClassSessionRecord> {
    return (tx ?? this.prisma).classSession.update({
      where: { id },
      data,
      select: CLASS_SESSION_SELECT,
    });
  }

  async softDelete(id: string, tx?: Tx): Promise<void> {
    await (tx ?? this.prisma).classSession.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
