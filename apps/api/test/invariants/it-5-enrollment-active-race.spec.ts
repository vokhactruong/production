import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, isUniqueViolation, resetDatabase } from "./support/test-db";
import { daysAgoUtc, seedFixtureGraph } from "./support/fixtures";

/**
 * IT-5 — One ACTIVE enrollment per (student, class) holds under race.
 * DoD invariant 5 (regression guard): the partial unique index
 * `enrollments_active_student_class_key` — (studentId, classId) WHERE
 * status = 'ACTIVE' AND "deletedAt" IS NULL (migration
 * 20260705000000_add_enrollment) — is the race-condition backstop behind the
 * application-level check in EnrollmentsService. Concurrent creates must
 * leave exactly one live ACTIVE row, while non-ACTIVE history rows for the
 * same (student, class) may coexist freely.
 */
const prisma = createTestPrisma();

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function activeEnrollmentData(studentId: string, classId: string) {
  return {
    studentId,
    classId,
    status: "ACTIVE" as const,
    joinedAt: daysAgoUtc(1),
    billingCycleSessions: 15,
  };
}

describe("IT-5 — one-ACTIVE-enrollment race guard", () => {
  it("concurrent ACTIVE creates for the same (student, class): exactly one wins", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 0 });
    const student = await prisma.student.create({
      data: { code: "STU-IT5-RACE", firstName: "Race", lastName: "Guard", status: "ACTIVE" },
    });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        prisma.enrollment.create({ data: activeEnrollmentData(student.id, fx.classId) })
      )
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    // Every loser fails with the unique violation from the partial index —
    // never a duplicate row, never a different error class.
    for (const r of rejected) expect(isUniqueViolation(r.reason)).toBe(true);

    const active = await prisma.enrollment.findMany({
      where: { studentId: student.id, classId: fx.classId, status: "ACTIVE", deletedAt: null },
    });
    expect(active).toHaveLength(1);
  });

  it("the index is scoped to ACTIVE: history rows coexist, a second ACTIVE never does", async () => {
    const fx = await seedFixtureGraph(prisma, { students: 1 });
    const studentId = fx.students[0].id; // fixture already holds one ACTIVE enrollment

    // Second ACTIVE while one exists: rejected.
    let error: unknown;
    try {
      await prisma.enrollment.create({ data: activeEnrollmentData(studentId, fx.classId) });
    } catch (err) {
      error = err;
    }
    expect(isUniqueViolation(error)).toBe(true);

    // Cancel the ACTIVE one → a fresh ACTIVE enrollment is allowed again
    // (multiple non-ACTIVE records per (student, class) over time is the
    // intended business history).
    await prisma.enrollment.update({
      where: { id: fx.enrollments[0].id },
      data: { status: "CANCELLED" },
    });
    await prisma.enrollment.create({ data: activeEnrollmentData(studentId, fx.classId) });

    const all = await prisma.enrollment.findMany({
      where: { studentId, classId: fx.classId, deletedAt: null },
    });
    expect(all).toHaveLength(2);
    expect(all.filter((e) => e.status === "ACTIVE")).toHaveLength(1);
  });
});
