import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-12 — ⚑5 atomicity: an overpayment writes the PAYMENT and the CREDIT_GRANT
 * in one createMany statement (atomic on Postgres, no interactive transaction).
 * Both rows land together, with the correct split.
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-12 — payment + overpayment credit are atomic", () => {
  it("one overpayment produces exactly one PAYMENT and one CREDIT_GRANT with the right split", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const a = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, sessionsSold: 15 },
      fx.userId
    );
    await services.paymentRecording.recordPayment(
      { billingCycleId: a.id, amount: 1200000, method: "CASH" },
      fx.userId
    );

    const pay = await prisma.ledgerEntry.findMany({
      where: { type: "PAYMENT", billingCycleId: a.id },
    });
    const grant = await prisma.ledgerEntry.findMany({
      where: { type: "CREDIT_GRANT", billingCycleId: a.id },
    });
    expect(pay).toHaveLength(1);
    expect(grant).toHaveLength(1);
    expect(Number(pay[0].amount)).toBe(1000000); // settled portion
    expect(Number(grant[0].amount)).toBe(200000); // overpayment → credit
    // The PAYMENT carries the receipt; the CREDIT_GRANT does not.
    expect(pay[0].receiptNumber).not.toBeNull();
    expect(grant[0].receiptNumber).toBeNull();
  });
});
