import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import { buildServices, rosterPayload, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-2 — No double lesson deduction under retry/race.
 * DoD invariant 2 (+ Q3 reversal): firing the bulk upsert for the same roster
 * concurrently/repeatedly never produces more than one row per (enrollment,
 * session) — the P2002 race loser converts to a re-read + update (cross-review
 * correction 1) — so the derived COUNT (LessonConsumptionService) is exactly 1
 * per deducting row once the session COMPLETEs, and correcting to EXCUSED
 * lowers the count (reversal by construction — no reversal code exists).
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-2 — no double deduction under retry/race", () => {
  it("concurrent recordSession calls for the same roster: one row per key, no unhandled throw", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 3 });
    const payload = rosterPayload(fx.enrollments, "PRESENT");

    // Five concurrent bulk recordings of the SAME roster. Losers of the
    // create race hit P2002 from the partial-unique index and must convert it
    // to a re-read + update internally — Promise.all (not allSettled) asserts
    // that no call surfaces the race as an error.
    await Promise.all(
      Array.from({ length: 5 }, () =>
        services.attendance.recordSession(fx.session.id, payload, fx.teacher)
      )
    );

    const rows = await prisma.attendance.findMany({
      where: { classSessionId: fx.session.id, deletedAt: null },
    });
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((r) => r.enrollmentId)).size).toBe(3);
    expect(rows.map((r) => r.status)).toEqual(["PRESENT", "PRESENT", "PRESENT"]);
  });

  it("after COMPLETED the derived count is exactly 1 per deducting row, even after retries", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 2 });
    const payload = rosterPayload(fx.enrollments, "PRESENT");
    const ids = fx.enrollments.map((e) => e.id);

    // Record (with a concurrent retry), then complete through the real
    // service so the E1 gate and the status transition both run for real.
    await Promise.all([
      services.attendance.recordSession(fx.session.id, payload, fx.teacher),
      services.attendance.recordSession(fx.session.id, payload, fx.teacher),
    ]);

    // Before completion nothing is consumed — deduction is tied to the
    // Session → COMPLETED business event, not to attendance marking (Q3).
    const before = await services.lessonConsumption.getConsumedByEnrollmentIds(ids);
    expect(before.get(ids[0]) ?? 0).toBe(0);
    expect(before.get(ids[1]) ?? 0).toBe(0);

    await services.classSessions.update(fx.session.id, { status: "COMPLETED" }, fx.userId);

    const consumed = await services.lessonConsumption.getConsumedByEnrollmentIds(ids);
    expect(consumed.get(ids[0])).toBe(1);
    expect(consumed.get(ids[1])).toBe(1);

    // Idempotent re-POST of the same payload on the COMPLETED session (a
    // retry arriving late): a no-op update path — the count must not move.
    await services.attendance.recordSession(fx.session.id, payload, fx.teacher);
    const afterRetry = await services.lessonConsumption.getConsumedByEnrollmentIds(ids);
    expect(afterRetry.get(ids[0])).toBe(1);
    expect(afterRetry.get(ids[1])).toBe(1);
    expect(
      await prisma.attendance.count({ where: { classSessionId: fx.session.id, deletedAt: null } })
    ).toBe(2);
  });

  it("correcting PRESENT → EXCUSED lowers the count (reversal by construction)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 2 });
    const ids = fx.enrollments.map((e) => e.id);

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "PRESENT"),
      fx.teacher
    );
    await services.classSessions.update(fx.session.id, { status: "COMPLETED" }, fx.userId);

    const row = await prisma.attendance.findFirst({
      where: { enrollmentId: ids[0], classSessionId: fx.session.id, deletedAt: null },
    });
    // PATCH correction to the non-deducting status: no reversal code runs —
    // the derived COUNT simply stops including the row.
    await services.attendance.correct(row!.id, { status: "EXCUSED" }, fx.teacher);

    const consumed = await services.lessonConsumption.getConsumedByEnrollmentIds(ids);
    expect(consumed.get(ids[0]) ?? 0).toBe(0);
    expect(consumed.get(ids[1])).toBe(1);

    // remaining = billingCycleSessions − consumed, per enrollment.
    const { lessonConsumption } = services;
    expect(lessonConsumption.remainingFor(fx.enrollments[0], consumed.get(ids[0]) ?? 0)).toBe(15);
    expect(lessonConsumption.remainingFor(fx.enrollments[1], consumed.get(ids[1]) ?? 0)).toBe(14);
  });
});
