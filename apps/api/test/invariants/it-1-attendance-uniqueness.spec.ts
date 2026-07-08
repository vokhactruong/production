import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { createTestPrisma, isUniqueViolation, resetDatabase } from "./support/test-db";
import { buildServices, rosterPayload, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-1 — One attendance record per (enrollmentId, classSessionId).
 * DoD invariant 1: recording twice via the service updates instead of
 * duplicating; a direct double-insert at the DB is rejected by the
 * partial-unique index `attendances_active_enrollment_session_key`
 * (migration 20260709000000_add_attendance).
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-1 — attendance uniqueness per (enrollment, session)", () => {
  it("re-recording the same roster updates, never duplicates", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 2 });

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "PRESENT"),
      fx.teacher
    );
    // Identical re-POST (retry / double-submit): must be a no-op, not a duplicate.
    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "PRESENT"),
      fx.teacher
    );

    const afterRepost = await prisma.attendance.findMany({
      where: { classSessionId: fx.session.id, deletedAt: null },
    });
    expect(afterRepost).toHaveLength(2);
    expect(new Set(afterRepost.map((r) => r.enrollmentId)).size).toBe(2);

    // Re-POST with a different status: updates the SAME rows in place.
    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "LATE"),
      fx.teacher
    );
    const afterChange = await prisma.attendance.findMany({
      where: { classSessionId: fx.session.id, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    expect(afterChange).toHaveLength(2);
    expect(afterChange.map((r) => r.status)).toEqual(["LATE", "LATE"]);
    expect(new Set(afterChange.map((r) => r.id))).toEqual(new Set(afterRepost.map((r) => r.id)));
  });

  it("direct double-insert at the DB is rejected by the partial-unique index", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const key = { enrollmentId: fx.enrollments[0].id, classSessionId: fx.session.id };

    await prisma.attendance.create({ data: { ...key, status: "PRESENT" } });

    let error: unknown;
    try {
      await prisma.attendance.create({ data: { ...key, status: "ABSENT" } });
    } catch (err) {
      error = err;
    }
    expect(isUniqueViolation(error)).toBe(true);

    const live = await prisma.attendance.findMany({ where: { ...key, deletedAt: null } });
    expect(live).toHaveLength(1);
  });
});

describe("IT-1 supporting rule — D4 writable-status matrix (approved decision D4)", () => {
  it("PLANNED sessions reject recording (no pre-marking)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1, session: { status: "PLANNED" } });
    await expect(
      services.attendance.recordSession(
        fx.session.id,
        rosterPayload(fx.enrollments, "PRESENT"),
        fx.teacher
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await prisma.attendance.count({ where: { classSessionId: fx.session.id } })).toBe(0);
  });

  it("CANCELLED sessions always reject recording", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1, session: { status: "CANCELLED" } });
    await expect(
      services.attendance.recordSession(
        fx.session.id,
        rosterPayload(fx.enrollments, "PRESENT"),
        fx.teacher
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await prisma.attendance.count({ where: { classSessionId: fx.session.id } })).toBe(0);
  });

  it("COMPLETED sessions accept updates of existing rows but never new rows", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 2 });
    const [marked, lateJoiner] = fx.enrollments;

    // Mark only the first enrollment while ONGOING, then complete the session
    // at the DB level (state setup — the E1 gate itself is IT-6's subject).
    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload([marked], "PRESENT"),
      fx.teacher
    );
    await prisma.classSession.update({
      where: { id: fx.session.id },
      data: { status: "COMPLETED" },
    });

    // Correction of the existing row via bulk: allowed.
    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload([marked], "EXCUSED"),
      fx.teacher
    );
    const corrected = await prisma.attendance.findFirst({
      where: { enrollmentId: marked.id, classSessionId: fx.session.id, deletedAt: null },
    });
    expect(corrected?.status).toBe("EXCUSED");

    // A brand-new row on the COMPLETED session: rejected (a new row on a past
    // session would instantly consume a lesson — mid-cycle backfill is
    // deliberately impossible, Slice #1/#2 boundary).
    await expect(
      services.attendance.recordSession(
        fx.session.id,
        rosterPayload([lateJoiner], "PRESENT"),
        fx.teacher
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      await prisma.attendance.count({
        where: { enrollmentId: lateJoiner.id, classSessionId: fx.session.id },
      })
    ).toBe(0);
  });
});
