import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LessonConsumptionService } from "../attendance/lesson-consumption.service";

export type CycleTotals = { charge: number; settled: number; outstanding: number };

/**
 * The money analogue of LessonConsumptionService: Derived Balance is Source of
 * Truth applied to money. This service NEVER writes. Every figure is a grouped
 * SUM over the append-only LedgerEntry table (BI-7) — no stored counter exists.
 *
 * Amounts are stored UNSIGNED (P1); the sign algebra — what each `type` adds to
 * owed, revenue, or liability — lives ONLY here, nowhere else:
 *
 *   outstanding(cycle)     = Σ CHARGE − Σ PAYMENT − Σ CREDIT_OFFSET      (per cycle)
 *   revenue                = Σ PAYMENT                                    (never any credit type)
 *   creditBalance(student) = Σ CREDIT_GRANT − Σ CREDIT_OFFSET − Σ REFUND  (per student)
 *
 * These are exactly the BI-11 conservation equations, so value is never created
 * or destroyed. Revenue and liability are kept as strictly separate views (BI-10).
 */
@Injectable()
export class DerivedMoneyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonConsumption: LessonConsumptionService
  ) {}

  private num(d: Prisma.Decimal | null | undefined): number {
    return d ? d.toNumber() : 0;
  }

  /** Charge / settled / outstanding per cycle, in ONE grouped query
   * (aggregate, never N+1). Shared basis for outstanding reads and the F2
   * fully-paid check. */
  async getCycleTotals(cycleIds: string[]): Promise<Map<string, CycleTotals>> {
    const out = new Map<string, CycleTotals>();
    if (cycleIds.length === 0) return out;
    for (const id of cycleIds) out.set(id, { charge: 0, settled: 0, outstanding: 0 });

    const rows = await this.prisma.ledgerEntry.groupBy({
      by: ["billingCycleId", "type"],
      where: {
        billingCycleId: { in: cycleIds },
        deletedAt: null,
        type: { in: ["CHARGE", "PAYMENT", "CREDIT_OFFSET"] },
      },
      _sum: { amount: true },
    });

    for (const r of rows) {
      if (!r.billingCycleId) continue;
      const t = out.get(r.billingCycleId);
      if (!t) continue;
      const v = this.num(r._sum.amount);
      if (r.type === "CHARGE") t.charge += v;
      else t.settled += v; // PAYMENT + CREDIT_OFFSET both reduce owed
    }
    for (const t of out.values()) t.outstanding = t.charge - t.settled;
    return out;
  }

  async getOutstandingByCycleIds(cycleIds: string[]): Promise<Map<string, number>> {
    const totals = await this.getCycleTotals(cycleIds);
    const out = new Map<string, number>();
    for (const [id, t] of totals) out.set(id, t.outstanding);
    return out;
  }

  async getOutstandingForCycle(cycleId: string): Promise<number> {
    return (await this.getCycleTotals([cycleId])).get(cycleId)?.outstanding ?? 0;
  }

  /** A cycle is "fully paid" only when it has a real charge AND nothing is owed
   * — the guard behind F2 self-healing activation, so a mid-failed sale (no
   * CHARGE) can never activate for free. */
  async isCycleFullyPaid(cycleId: string): Promise<boolean> {
    const t = (await this.getCycleTotals([cycleId])).get(cycleId);
    return !!t && t.charge > 0 && t.outstanding <= 0;
  }

  /** Σ PAYMENT for one cycle — the cash actually paid in (used to compute the
   * unused value refunded as credit on withdrawal). Excludes CREDIT_OFFSET. */
  async getPaidByCycleId(cycleId: string): Promise<number> {
    const r = await this.prisma.ledgerEntry.aggregate({
      where: { billingCycleId: cycleId, type: "PAYMENT", deletedAt: null },
      _sum: { amount: true },
    });
    return this.num(r._sum.amount);
  }

  /** Total settled revenue — Σ PAYMENT only, credit excluded (BI-10). */
  async getRevenue(range?: { from?: Date; to?: Date }): Promise<number> {
    const r = await this.prisma.ledgerEntry.aggregate({
      where: {
        type: "PAYMENT",
        deletedAt: null,
        ...(range?.from || range?.to
          ? {
              createdAt: {
                ...(range.from && { gte: range.from }),
                ...(range.to && { lte: range.to }),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
    return this.num(r._sum.amount);
  }

  /** Credit balance per student (student-scoped, OQ-D), in one grouped query. */
  async getCreditBalanceByStudentIds(studentIds: string[]): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (studentIds.length === 0) return out;

    const rows = await this.prisma.ledgerEntry.groupBy({
      by: ["studentId", "type"],
      where: {
        studentId: { in: studentIds },
        deletedAt: null,
        type: { in: ["CREDIT_GRANT", "CREDIT_OFFSET", "REFUND"] },
      },
      _sum: { amount: true },
    });

    const acc = new Map<string, { grant: number; used: number }>();
    for (const id of studentIds) acc.set(id, { grant: 0, used: 0 });
    for (const r of rows) {
      const a = acc.get(r.studentId);
      if (!a) continue;
      const v = this.num(r._sum.amount);
      if (r.type === "CREDIT_GRANT") a.grant += v;
      else a.used += v; // CREDIT_OFFSET + REFUND both draw the balance down
    }
    for (const [id, a] of acc) out.set(id, a.grant - a.used);
    return out;
  }

  async getCreditBalanceForStudent(studentId: string): Promise<number> {
    return (await this.getCreditBalanceByStudentIds([studentId])).get(studentId) ?? 0;
  }

  /**
   * Capacity-based sequential (FIFO) attribution of consumed lessons across an
   * enrollment's cycles (P4). Cycles are ordered by creation; each absorbs
   * consumption up to its `sessionsSold` cap; remaining is a pure function of
   * current evidence — nothing stored, nothing to heal even when a 48h
   * correction retroactively changes the total consumed. LessonConsumptionService
   * stays the single source of the total (untouched).
   *
   *   remaining(cycle_k) = cap_k − clamp(totalConsumed − Σ cap_(<k), 0, cap_k)
   */
  async getCycleRemainingMap(enrollmentId: string): Promise<Map<string, number>> {
    const cycles = await this.prisma.billingCycle.findMany({
      where: { enrollmentId, deletedAt: null, status: { not: "CANCELLED" } },
      select: { id: true, sessionsSold: true },
      orderBy: { createdAt: "asc" },
    });
    const consumedMap = await this.lessonConsumption.getConsumedByEnrollmentIds([enrollmentId]);
    let remainingConsumption = consumedMap.get(enrollmentId) ?? 0;

    const out = new Map<string, number>();
    for (const c of cycles) {
      const consumedHere = Math.min(Math.max(remainingConsumption, 0), c.sessionsSold);
      remainingConsumption -= consumedHere;
      out.set(c.id, c.sessionsSold - consumedHere);
    }
    return out;
  }
}
