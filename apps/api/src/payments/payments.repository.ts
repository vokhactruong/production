import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Tx = Prisma.TransactionClient;

const BILLING_CYCLE_SELECT = {
  id: true,
  enrollmentId: true,
  status: true,
  snapshotPrice: true,
  snapshotDiscount: true,
  sessionsSold: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  enrollment: {
    select: {
      id: true,
      studentId: true,
      classId: true,
      student: { select: { id: true, code: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.BillingCycleSelect;

export type BillingCycleRecord = Prisma.BillingCycleGetPayload<{
  select: typeof BILLING_CYCLE_SELECT;
}>;

const LEDGER_ENTRY_SELECT = {
  id: true,
  type: true,
  amount: true,
  studentId: true,
  billingCycleId: true,
  method: true,
  receiptNumber: true,
  creditSource: true,
  refundStatus: true,
  note: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LedgerEntrySelect;

export type LedgerEntryRecord = Prisma.LedgerEntryGetPayload<{
  select: typeof LEDGER_ENTRY_SELECT;
}>;

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ----- BillingCycle -----

  async findCycleById(id: string, tx?: Tx): Promise<BillingCycleRecord | null> {
    return (tx ?? this.prisma).billingCycle.findFirst({
      where: { id, deletedAt: null },
      select: BILLING_CYCLE_SELECT,
    });
  }

  async findCycles(params: {
    where: Prisma.BillingCycleWhereInput;
    orderBy: Prisma.BillingCycleOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<BillingCycleRecord[]> {
    return this.prisma.billingCycle.findMany({
      where: params.where,
      select: BILLING_CYCLE_SELECT,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }

  async countCycles(where: Prisma.BillingCycleWhereInput): Promise<number> {
    return this.prisma.billingCycle.count({ where });
  }

  async createCycle(
    data: Prisma.BillingCycleCreateInput,
    tx?: Tx
  ): Promise<{ id: string; status: string }> {
    return (tx ?? this.prisma).billingCycle.create({
      data,
      select: { id: true, status: true },
    });
  }

  async updateCycleStatus(
    id: string,
    status: Prisma.BillingCycleUpdateInput["status"]
  ): Promise<void> {
    await this.prisma.billingCycle.update({ where: { id }, data: { status } });
  }

  /** The enrollment's live PENDING cycle (at most one — F1 one-PENDING index),
   * with its frozen snapshot — used to heal a chargeless orphan on the sale path
   * (BI-12). */
  async findPendingCycleForEnrollment(
    enrollmentId: string
  ): Promise<{ id: string; snapshotPrice: Prisma.Decimal } | null> {
    return this.prisma.billingCycle.findFirst({
      where: { enrollmentId, status: "PENDING", deletedAt: null },
      select: { id: true, snapshotPrice: true },
    });
  }

  /** Live (non-deleted), non-CANCELLED cycles for an enrollment, oldest first —
   * the ordering capacity-based FIFO attribution walks (P4). */
  async findLiveCyclesForEnrollment(
    enrollmentId: string
  ): Promise<Array<{ id: string; sessionsSold: number; status: string; createdAt: Date }>> {
    return this.prisma.billingCycle.findMany({
      where: { enrollmentId, deletedAt: null, status: { not: "CANCELLED" } },
      select: { id: true, sessionsSold: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }

  // ----- LedgerEntry -----

  /** Draws the next global receipt number from the Postgres sequence (⚑4).
   * Never reused; gaps acceptable. Single statement — no transaction. */
  async nextReceiptNumber(): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ value: number }>>`
      SELECT nextval('receipt_number_seq')::int AS value`;
    return rows[0].value;
  }

  /** Writes N ledger rows in ONE INSERT statement (⚑5 — atomic on Postgres
   * without an interactive transaction; no pgbouncer exposure). */
  async createLedgerEntries(data: Prisma.LedgerEntryCreateManyInput[]): Promise<void> {
    await this.prisma.ledgerEntry.createMany({ data });
  }

  async findLedger(params: {
    where: Prisma.LedgerEntryWhereInput;
    skip: number;
    take: number;
  }): Promise<LedgerEntryRecord[]> {
    return this.prisma.ledgerEntry.findMany({
      where: params.where,
      select: LEDGER_ENTRY_SELECT,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  }

  async countLedger(where: Prisma.LedgerEntryWhereInput): Promise<number> {
    return this.prisma.ledgerEntry.count({ where });
  }

  async findLedgerById(id: string): Promise<LedgerEntryRecord | null> {
    return this.prisma.ledgerEntry.findFirst({
      where: { id, deletedAt: null },
      select: LEDGER_ENTRY_SELECT,
    });
  }

  async findByReceiptNumber(receiptNumber: number): Promise<LedgerEntryRecord | null> {
    return this.prisma.ledgerEntry.findFirst({
      where: { receiptNumber, type: "PAYMENT", deletedAt: null },
      select: LEDGER_ENTRY_SELECT,
    });
  }

  async updateLedgerRefundStatus(
    id: string,
    refundStatus: Prisma.LedgerEntryUpdateInput["refundStatus"]
  ): Promise<void> {
    await this.prisma.ledgerEntry.update({ where: { id }, data: { refundStatus } });
  }
}
