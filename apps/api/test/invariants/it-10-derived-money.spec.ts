import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-10 — BI-7 (money is derived, no stored counters) and BI-10 (revenue and
 * liability are strictly separate; an offset conserves value — lowers owed and
 * liability by the same amount, credit is never counted as revenue).
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-10 — derived money, revenue vs liability", () => {
  it("BI-7: no stored money counter columns exist on the money tables", async () => {
    const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name IN ('billing_cycles', 'ledger_entries')`;
    const names = cols.map((c) => c.column_name.toLowerCase());
    for (const forbidden of [
      "outstanding",
      "paid",
      "balance",
      "revenue",
      "consumed",
      "remaining",
    ]) {
      expect(names).not.toContain(forbidden);
    }
  });

  it("BI-10: overpayment is credit liability, never revenue", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const cycle = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, sessionsSold: 15 },
      fx.userId
    );
    await services.paymentRecording.recordPayment(
      { billingCycleId: cycle.id, amount: 1200000, method: "CASH" },
      fx.userId
    );

    expect(await services.derivedMoney.getRevenue()).toBe(1000000); // settled payment only
    expect(await services.derivedMoney.getCreditBalanceForStudent(fx.students[0].id)).toBe(200000);
    expect(await services.derivedMoney.getOutstandingForCycle(cycle.id)).toBe(0);
  });

  it("BI-10: offset lowers owed and liability by the same amount (value conserved)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const e = fx.enrollments[0];
    const studentId = fx.students[0].id;

    const a = await services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId);
    await services.paymentRecording.recordPayment(
      { billingCycleId: a.id, amount: 1200000, method: "CASH" },
      fx.userId
    ); // A settled + activated, 200000 credit

    const b = await services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId);
    const balanceBefore = await services.derivedMoney.getCreditBalanceForStudent(studentId);
    const owedBefore = await services.derivedMoney.getOutstandingForCycle(b.id);

    const res = await services.credit.offset({ billingCycleId: b.id }, fx.userId);
    expect(res.offsetAmount).toBe(200000);
    expect(await services.derivedMoney.getOutstandingForCycle(b.id)).toBe(owedBefore - 200000);
    expect(await services.derivedMoney.getCreditBalanceForStudent(studentId)).toBe(
      balanceBefore - 200000
    );
  });
});
