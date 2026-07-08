import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, isUniqueViolation, resetDatabase } from "./support/test-db";
import { buildServices, rosterPayload, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-3 — Soft delete does not break the uniqueness rule.
 * DoD invariant 3 (partial-unique convention): the unique index on
 * (enrollmentId, classSessionId) is scoped WHERE "deletedAt" IS NULL
 * (migration 20260709000000_add_attendance), so a soft-deleted row's key can
 * be reused — while two LIVE rows for the same key can never coexist.
 *
 * Note: the application offers no delete path for attendance (corrections
 * only — approved business rule), so the soft delete here is DB-level state
 * setup for the convention itself, not an exercised service path.
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-3 — soft delete does not break uniqueness", () => {
  it("after a soft delete, the service re-creates the same key as a NEW live row", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const key = { enrollmentId: fx.enrollments[0].id, classSessionId: fx.session.id };

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "PRESENT"),
      fx.teacher
    );
    const original = await prisma.attendance.findFirst({ where: { ...key, deletedAt: null } });

    await prisma.attendance.update({
      where: { id: original!.id },
      data: { deletedAt: new Date() },
    });

    // The live-scoped lookup (findActiveByEnrollmentAndSession) no longer sees
    // the key, so the service takes the create path — and the partial index
    // lets the key be reused because the old row is soft-deleted.
    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "LATE"),
      fx.teacher
    );

    const live = await prisma.attendance.findMany({ where: { ...key, deletedAt: null } });
    expect(live).toHaveLength(1);
    expect(live[0].id).not.toBe(original!.id);
    expect(live[0].status).toBe("LATE");
    expect(await prisma.attendance.count({ where: key })).toBe(2); // history preserved
  });

  it("two live rows never coexist: a second live insert for a reused key still rejects", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const key = { enrollmentId: fx.enrollments[0].id, classSessionId: fx.session.id };

    const first = await prisma.attendance.create({ data: { ...key, status: "PRESENT" } });
    await prisma.attendance.update({ where: { id: first.id }, data: { deletedAt: new Date() } });

    // Reusing the key after the soft delete: allowed.
    await prisma.attendance.create({ data: { ...key, status: "ABSENT" } });

    // But a THIRD row while one live row exists: rejected by the partial index.
    let error: unknown;
    try {
      await prisma.attendance.create({ data: { ...key, status: "EXCUSED" } });
    } catch (err) {
      error = err;
    }
    expect(isUniqueViolation(error)).toBe(true);

    const live = await prisma.attendance.findMany({ where: { ...key, deletedAt: null } });
    expect(live).toHaveLength(1);
    expect(live[0].status).toBe("ABSENT");
    expect(await prisma.attendance.count({ where: key })).toBe(2);
  });
});
