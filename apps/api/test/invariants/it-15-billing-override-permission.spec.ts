import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-15 — Q5 authorization: a manual price override is a privileged action.
 * Selling with `priceOverride` requires the distinct `billing.override`
 * permission (checked as a permission, never a role — the `attendance.correct`
 * precedent); the pro-rata default path needs only `billing.create`.
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-15 — billing.override authorization", () => {
  it("rejects a price override when the actor lacks billing.override, writing nothing", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    await expect(
      services.billing.sell(
        { enrollmentId: fx.enrollments[0].id, priceOverride: 500000 },
        fx.userId
        // no permissions granted
      )
    ).rejects.toThrow(/quyền/);
    // The privileged action was refused before any ledger/cycle write.
    expect(await prisma.billingCycle.count({ where: { enrollmentId: fx.enrollments[0].id } })).toBe(
      0
    );
    expect(await prisma.ledgerEntry.count()).toBe(0);
  });

  it("allows a price override when the actor holds billing.override (snapshot = override)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const cycle = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, priceOverride: 500000 },
      fx.userId,
      ["billing.override"]
    );
    expect(Number(cycle.snapshotPrice)).toBe(500000);
    expect(cycle.outstanding).toBe(500000);
  });

  it("needs no override permission for the pro-rata default path", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const cycle = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, sessionsSold: 15 },
      fx.userId
    );
    expect(Number(cycle.snapshotPrice)).toBe(1000000);
  });
});
