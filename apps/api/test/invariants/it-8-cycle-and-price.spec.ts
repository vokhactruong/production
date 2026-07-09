import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-8 — BI-2 (≤1 ACTIVE and, via F1, ≤1 PENDING cycle per enrollment, DB-
 * protected under concurrency), BI-3 (snapshot price frozen), BI-8 (a course
 * price change affects zero existing cycles).
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-8 — cycle lifecycle + snapshot price", () => {
  it("BI-2/F1: concurrent sells create exactly one PENDING cycle", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        services.billing.sell({ enrollmentId: fx.enrollments[0].id }, fx.userId)
      )
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.billingCycle.count({ where: { enrollmentId: fx.enrollments[0].id } })).toBe(
      1
    );
  });

  it("BI-2: the one-ACTIVE partial-unique rejects a second ACTIVE cycle at the DB", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const base = {
      enrollmentId: fx.enrollments[0].id,
      status: "ACTIVE" as const,
      snapshotPrice: 1,
      sessionsSold: 1,
    };
    await prisma.billingCycle.create({ data: base });
    await expect(prisma.billingCycle.create({ data: base })).rejects.toThrow();
  });

  it("BI-3/BI-8: snapshot price is frozen; a later course price change does not touch it", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const cycle = await services.billing.sell(
      { enrollmentId: fx.enrollments[0].id, sessionsSold: 15 },
      fx.userId
    );
    expect(Number(cycle.snapshotPrice)).toBe(1000000);

    const klass = await prisma.class.findFirstOrThrow({ where: { id: fx.classId } });
    await prisma.course.update({ where: { id: klass.courseId }, data: { basePrice: 9999999 } });

    const after = await services.billing.findOne(cycle.id);
    expect(Number(after.snapshotPrice)).toBe(1000000);
    expect(after.outstanding).toBe(1000000);
  });
});
