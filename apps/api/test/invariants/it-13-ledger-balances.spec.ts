import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-13 — BI-11: the ledger must balance. After a full lifecycle (sale,
 * overpayment→credit, and a second sale settled partly by offset and partly by
 * cash), value is fully accounted for:
 *   per cycle:   Σ CHARGE = Σ PAYMENT + Σ CREDIT_OFFSET + outstanding
 *   per student: Σ CREDIT_GRANT = Σ CREDIT_OFFSET + Σ REFUND + credit balance
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

async function sumByType(where: Record<string, unknown>): Promise<Map<string, number>> {
  const rows = await prisma.ledgerEntry.groupBy({ by: ["type"], where, _sum: { amount: true } });
  return new Map(rows.map((r) => [r.type, Number(r._sum.amount ?? 0)]));
}

describe("IT-13 — BI-11 the ledger must balance", () => {
  it("per-cycle and per-student conservation hold after a full lifecycle", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const e = fx.enrollments[0];
    const studentId = fx.students[0].id;

    // A: sell 1,000,000 then overpay 1,200,000 → 200,000 credit.
    const a = await services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId);
    await services.paymentRecording.recordPayment(
      { billingCycleId: a.id, amount: 1200000, method: "CASH" },
      fx.userId
    );

    // B: sell 1,000,000; offset 200,000 credit; pay the remaining 800,000.
    const b = await services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId);
    await services.credit.offset({ billingCycleId: b.id }, fx.userId);
    await services.paymentRecording.recordPayment(
      { billingCycleId: b.id, amount: 800000, method: "BANK_TRANSFER" },
      fx.userId
    );

    // Per-cycle conservation.
    for (const cycleId of [a.id, b.id]) {
      const s = await sumByType({ billingCycleId: cycleId });
      const outstanding = await services.derivedMoney.getOutstandingForCycle(cycleId);
      expect(s.get("CHARGE") ?? 0).toBe(
        (s.get("PAYMENT") ?? 0) + (s.get("CREDIT_OFFSET") ?? 0) + outstanding
      );
    }

    // Per-student conservation.
    const s = await sumByType({ studentId });
    const balance = await services.derivedMoney.getCreditBalanceForStudent(studentId);
    expect(s.get("CREDIT_GRANT") ?? 0).toBe(
      (s.get("CREDIT_OFFSET") ?? 0) + (s.get("REFUND") ?? 0) + balance
    );
  });
});
