import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { createTestPrisma, resetDatabase } from "./support/test-db";
import {
  buildServices,
  createSession,
  daysAgoUtc,
  daysFromNowUtc,
  rosterPayload,
  seedFixtureGraph,
} from "./support/fixtures";

/**
 * IT-6 — E1 completion precondition (Founder invariant) + timeline rules.
 * DoD invariant 6: a ClassSession cannot transition ONGOING → COMPLETED until
 * attendance has been finalized for ALL ACTIVE enrollments — enforced in the
 * service layer through the SessionCompletionPolicy seam (D1: ClassSessionsService
 * knows only the token, never Attendance). EXCUSED is a finalized status; an
 * empty roster completes trivially. Plus the timeline readings: CANCELLED
 * sessions never consume; a date-moved session that later COMPLETEs does.
 */
const prisma = createTestPrisma();
const services = buildServices(prisma);

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("IT-6 — E1: completion blocked until the roster is finalized", () => {
  it("ONGOING → COMPLETED rejects while any ACTIVE enrollment is unmarked; EXCUSED finalizes", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 2 });
    const [marked, unmarked] = fx.enrollments;

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload([marked], "PRESENT"),
      fx.teacher
    );

    // One ACTIVE enrollment still unmarked → the policy rejects the transition.
    await expect(
      services.classSessions.update(fx.session.id, { status: "COMPLETED" }, fx.userId)
    ).rejects.toBeInstanceOf(BadRequestException);
    const still = await prisma.classSession.findUnique({ where: { id: fx.session.id } });
    expect(still?.status).toBe("ONGOING");

    // EXCUSED counts as finalized (any recorded status does) → completes now.
    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload([unmarked], "EXCUSED"),
      fx.teacher
    );
    await services.classSessions.update(fx.session.id, { status: "COMPLETED" }, fx.userId);
    const done = await prisma.classSession.findUnique({ where: { id: fx.session.id } });
    expect(done?.status).toBe("COMPLETED");
  });

  it("only ACTIVE enrollments gate completion — an unmarked non-ACTIVE enrollment does not block", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    // A cancelled enrollment on the same class, never marked.
    const dropout = await prisma.student.create({
      data: { code: "STU-IT6-DROP", firstName: "Dropped", lastName: "Out", status: "ACTIVE" },
    });
    await prisma.enrollment.create({
      data: {
        studentId: dropout.id,
        classId: fx.classId,
        status: "CANCELLED",
        joinedAt: daysAgoUtc(30),
        billingCycleSessions: 15,
      },
    });

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "PRESENT"),
      fx.teacher
    );
    await services.classSessions.update(fx.session.id, { status: "COMPLETED" }, fx.userId);
    const done = await prisma.classSession.findUnique({ where: { id: fx.session.id } });
    expect(done?.status).toBe("COMPLETED");
  });

  it("an empty roster (0 ACTIVE enrollments) completes trivially", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 0 });
    await services.classSessions.update(fx.session.id, { status: "COMPLETED" }, fx.userId);
    const done = await prisma.classSession.findUnique({ where: { id: fx.session.id } });
    expect(done?.status).toBe("COMPLETED");
  });
});

describe("IT-6 — timeline consequences of the COMPLETED business event", () => {
  it("a CANCELLED session's attendance rows (if any) never count in the balance", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const cancelled = await createSession(prisma, fx.classId, 2, { status: "CANCELLED" });

    // The service rightly refuses to record on CANCELLED sessions, so a stray
    // row is planted at the DB level — even then it must never consume,
    // because consumption keys off ClassSession.status = COMPLETED alone.
    await prisma.attendance.create({
      data: {
        enrollmentId: fx.enrollments[0].id,
        classSessionId: cancelled.id,
        status: "PRESENT",
      },
    });

    const consumed = await services.lessonConsumption.getConsumedByEnrollmentIds([
      fx.enrollments[0].id,
    ]);
    expect(consumed.get(fx.enrollments[0].id) ?? 0).toBe(0);
  });

  it("a date-moved session that later COMPLETEs does consume (rescheduling moves the timeline, it does not exit it)", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload(fx.enrollments, "PRESENT"),
      fx.teacher
    );

    // Reschedule: edits `date` only, triggers nothing.
    await services.classSessions.update(
      fx.session.id,
      { date: daysFromNowUtc(1).toISOString() },
      fx.userId
    );
    const moved = await services.lessonConsumption.getConsumedByEnrollmentIds([
      fx.enrollments[0].id,
    ]);
    expect(moved.get(fx.enrollments[0].id) ?? 0).toBe(0);

    // ...but the moved session still walks the timeline to COMPLETED — and
    // then its deducting rows count.
    await services.classSessions.update(fx.session.id, { status: "COMPLETED" }, fx.userId);
    const consumed = await services.lessonConsumption.getConsumedByEnrollmentIds([
      fx.enrollments[0].id,
    ]);
    expect(consumed.get(fx.enrollments[0].id)).toBe(1);
  });
});

// D4 writable-status matrix around the completion boundary (approved D4:
// PLANNED ❌❌ · ONGOING ✅✅ · COMPLETED ❌create ✅update · CANCELLED ❌❌).
// IT-1's supporting block asserts the same matrix from the idempotency angle;
// here it guards the E1 timeline: no evidence before the session starts, no
// backfill after it completed (Slice #1/#2 boundary), nothing on cancelled.
describe("IT-6 supporting rule — D4 matrix on recordSession", () => {
  it("PLANNED and CANCELLED sessions reject recording outright", async () => {
    for (const status of ["PLANNED", "CANCELLED"] as const) {
      const fx = await seedFixtureGraph(prisma, { students: 1, session: { status } });
      await expect(
        services.attendance.recordSession(
          fx.session.id,
          rosterPayload(fx.enrollments, "PRESENT"),
          fx.teacher
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(await prisma.attendance.count({ where: { classSessionId: fx.session.id } })).toBe(0);
      await resetDatabase(prisma);
    }
  });

  it("COMPLETED sessions accept updates of existing rows, never rows that would CREATE", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 2 });
    const [marked, lateJoiner] = fx.enrollments;

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload([marked], "PRESENT"),
      fx.teacher
    );
    await prisma.classSession.update({
      where: { id: fx.session.id },
      data: { status: "COMPLETED" },
    });

    await services.attendance.recordSession(
      fx.session.id,
      rosterPayload([marked], "LATE"),
      fx.teacher
    );
    const updated = await prisma.attendance.findFirst({
      where: { enrollmentId: marked.id, classSessionId: fx.session.id, deletedAt: null },
    });
    expect(updated?.status).toBe("LATE");

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
