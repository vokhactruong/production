import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph, consumeLessons } from "./support/fixtures";

/**
 * IT-9 — BI-4 (auto-renewal idempotent: remaining=0 → exactly one PENDING
 * successor, however many times the read-path trigger fires) and BI-9 (credit
 * arises only from overpayment or withdrawal).
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-9 — renewal idempotency + credit sources", () => {
  it("BI-4: consuming the whole cycle then reconciling N× makes exactly one PENDING successor", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const e = fx.enrollments[0];

    const cycle = await services.billing.sell({ enrollmentId: e.id, sessionsSold: 2 }, fx.userId);
    await services.paymentRecording.recordPayment(
      { billingCycleId: cycle.id, amount: cycle.outstanding, method: "CASH" },
      fx.userId
    );
    await consumeLessons(prisma, services, fx, 2); // cycle fully consumed

    for (let i = 0; i < 5; i += 1) await services.billing.reconcile(e.id);

    expect(
      await prisma.billingCycle.count({ where: { enrollmentId: e.id, status: "PENDING" } })
    ).toBe(1);
    expect(
      await prisma.billingCycle.count({ where: { enrollmentId: e.id, status: "COMPLETED" } })
    ).toBe(1);
  });

  it("BI-9: credit is created only by overpayment (and withdrawal), never elsewhere", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const cycle = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, sessionsSold: 15 },
      fx.userId
    );
    await services.paymentRecording.recordPayment(
      { billingCycleId: cycle.id, amount: 1200000, method: "CASH" },
      fx.userId
    );

    const grants = await prisma.ledgerEntry.findMany({ where: { type: "CREDIT_GRANT" } });
    expect(grants).toHaveLength(1);
    expect(grants[0].creditSource).toBe("OVERPAYMENT");
    expect(
      grants.every((g) => g.creditSource === "OVERPAYMENT" || g.creditSource === "WITHDRAWAL")
    ).toBe(true);
  });
});
