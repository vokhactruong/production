import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-14 — BI-12: no orphan billing cycles. A sale that crashes after creating
 * the PENDING cycle but before its CHARGE leaves a chargeless orphan. The next
 * business action (a sale retry, or an enrollment-read reconcile) completes the
 * missing CHARGE idempotently from the cycle's OWN frozen snapshot. Retry × N —
 * sequential OR concurrent — yields exactly one cycle and exactly one CHARGE.
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

/** A PENDING cycle with NO CHARGE row = a sale that crashed before its CHARGE. */
async function orphanCycle(enrollmentId: string, snapshotPrice = 1000000) {
  return prisma.billingCycle.create({
    data: { enrollmentId, status: "PENDING", snapshotPrice, sessionsSold: 15 },
  });
}

describe("IT-14 — BI-12 chargeless-cycle self-heal is idempotent under retry", () => {
  it("sequential retry × N: exactly one cycle and one CHARGE (heal, then real conflict)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const e = fx.enrollments[0];
    const orphan = await orphanCycle(e.id);

    let ok = 0;
    let conflict = 0;
    for (let i = 0; i < 5; i += 1) {
      try {
        await services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId);
        ok += 1;
      } catch {
        conflict += 1;
      }
    }
    expect(ok).toBe(1); // first retry heals the orphan
    expect(conflict).toBe(4); // once charged, further sales are real conflicts

    expect(await prisma.billingCycle.count({ where: { enrollmentId: e.id } })).toBe(1);
    expect(
      await prisma.ledgerEntry.count({ where: { billingCycleId: orphan.id, type: "CHARGE" } })
    ).toBe(1);
    // Healed from the cycle's OWN frozen snapshot.
    expect(await services.derivedMoney.getOutstandingForCycle(orphan.id)).toBe(1000000);
  });

  it("concurrent retry: the DB one-charge-per-cycle guard yields exactly one CHARGE", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const e = fx.enrollments[0];
    const orphan = await orphanCycle(e.id);

    await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId)
      )
    );

    expect(
      await prisma.ledgerEntry.count({ where: { billingCycleId: orphan.id, type: "CHARGE" } })
    ).toBe(1);
    expect(await prisma.billingCycle.count({ where: { enrollmentId: e.id } })).toBe(1);
  });

  it("a genuinely charged PENDING cycle keeps a second sale a real conflict", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const e = fx.enrollments[0];
    await services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId);
    await expect(
      services.billing.sell({ enrollmentId: e.id, sessionsSold: 15 }, fx.userId)
    ).rejects.toThrow();
    expect(await prisma.billingCycle.count({ where: { enrollmentId: e.id } })).toBe(1);
    expect(await prisma.ledgerEntry.count({ where: { type: "CHARGE" } })).toBe(1);
  });

  it("reconcile heals a renewal-style chargeless orphan (idempotent business-flow read)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const e = fx.enrollments[0];
    const orphan = await orphanCycle(e.id, 750000);

    await services.billing.reconcile(e.id);
    await services.billing.reconcile(e.id); // idempotent — no second CHARGE

    expect(
      await prisma.ledgerEntry.count({ where: { billingCycleId: orphan.id, type: "CHARGE" } })
    ).toBe(1);
    expect(await services.derivedMoney.getOutstandingForCycle(orphan.id)).toBe(750000);
  });
});
