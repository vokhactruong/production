import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph, consumeLessons } from "./support/fixtures";

/**
 * IT-7 — BI-1: debt exists if and only if a package sale created it. No
 * attendance write path can create, increase, or reduce debt.
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-7 — BI-1 debt only from sale", () => {
  it("attendance + completion move no money; only a sale writes a CHARGE", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });

    // Consume three lessons through the real attendance + completion path.
    await consumeLessons(prisma, services, fx, 3);
    expect(await prisma.ledgerEntry.count()).toBe(0); // no ledger movement at all

    // Selling the package is the only thing that creates debt.
    await services.billing.sell({ enrollmentId: fx.enrollments[0].id }, fx.userId);
    expect(await prisma.ledgerEntry.count({ where: { type: "CHARGE" } })).toBe(1);
  });
});
