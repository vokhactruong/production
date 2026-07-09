import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-11 — BI-5 (receipts never deleted/silently mutated; receipt numbers never
 * reused) and BI-6 (credit history is append-only; a refund changes status,
 * never erases value).
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-11 — receipt/credit immutability", () => {
  it("BI-5: receipt numbers strictly increase and cannot be duplicated", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const a = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, sessionsSold: 15 },
      fx.userId
    );
    const p1 = await services.paymentRecording.recordPayment(
      { billingCycleId: a.id, amount: 400000, method: "CASH" },
      fx.userId
    );
    const p2 = await services.paymentRecording.recordPayment(
      { billingCycleId: a.id, amount: 400000, method: "CASH" },
      fx.userId
    );
    expect(p2.receiptNumber).toBeGreaterThan(p1.receiptNumber);

    // The unique index forbids reusing a receipt number (never reused, BI-5).
    await expect(
      prisma.ledgerEntry.create({
        data: {
          type: "PAYMENT",
          amount: 1,
          studentId: fx.students[0].id,
          billingCycleId: a.id,
          receiptNumber: p1.receiptNumber,
        },
      })
    ).rejects.toThrow();
  });

  it("BI-6: refund flips status + adds a REFUND row without erasing the grant; no double refund", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const a = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, sessionsSold: 15 },
      fx.userId
    );
    await services.paymentRecording.recordPayment(
      { billingCycleId: a.id, amount: 1200000, method: "CASH" },
      fx.userId
    );
    const grant = await prisma.ledgerEntry.findFirstOrThrow({ where: { type: "CREDIT_GRANT" } });

    await services.credit.refund(grant.id, {}, fx.userId);

    const after = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: grant.id } });
    expect(after.refundStatus).toBe("REFUNDED");
    expect(Number(after.amount)).toBe(200000); // value history intact, never erased
    expect(await prisma.ledgerEntry.count({ where: { type: "REFUND" } })).toBe(1);
    expect(await services.derivedMoney.getCreditBalanceForStudent(fx.students[0].id)).toBe(0);

    await expect(services.credit.refund(grant.id, {}, fx.userId)).rejects.toThrow();
  });
});
