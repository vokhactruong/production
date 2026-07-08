import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, isUniqueViolation, resetDatabase } from "./support/test-db";
import { buildServices, createSession, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-4 — sessionNumber is never reused.
 * DoD invariant 4 (regression guard on the invariant this slice consumes):
 * sessionNumber is a business identifier ("Session 8" is a permanent label
 * that Attendance/Payment/Reports/Audit reference), so its uniqueness per
 * class is a FULL @@unique([classId, sessionNumber]) — deliberately NOT the
 * partial-unique convention — and the next-number lookup
 * (ClassSessionsRepository.findMaxSessionNumber) deliberately includes
 * soft-deleted rows (migration 20260707000000_class_session_number_never_reused).
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-4 — sessionNumber never reused", () => {
  it("a soft-deleted session's number cannot be reused (full unique, unlike the partial-unique convention)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 0 });

    await prisma.classSession.update({
      where: { id: fx.session.id },
      data: { deletedAt: new Date() },
    });

    // Same (classId, sessionNumber) with the old row soft-deleted: for
    // attendance/enrollment this would be allowed — for sessionNumber it must
    // still reject, because the label is permanent.
    let error: unknown;
    try {
      await createSession(prisma, fx.classId, fx.session.sessionNumber);
    } catch (err) {
      error = err;
    }
    expect(isUniqueViolation(error)).toBe(true);

    expect(
      await prisma.classSession.count({
        where: { classId: fx.classId, sessionNumber: fx.session.sessionNumber },
      })
    ).toBe(1);
  });

  it("MAX(sessionNumber) includes soft-deleted rows, so generation continues past deleted numbers", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 0 });
    await createSession(prisma, fx.classId, 2);
    const third = await createSession(prisma, fx.classId, 3);

    await prisma.classSession.update({ where: { id: third.id }, data: { deletedAt: new Date() } });

    // The scheduling services derive the next number from this lookup: it must
    // report 3 (not 2), so the next generated session becomes 4 — number 3 is
    // consumed forever even though its session is soft-deleted.
    expect(await services.classSessionsRepository.findMaxSessionNumber(fx.classId)).toBe(3);

    const next = await createSession(prisma, fx.classId, 4);
    expect(next.sessionNumber).toBe(4);
  });
});
