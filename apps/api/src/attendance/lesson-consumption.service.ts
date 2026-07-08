import { Injectable } from "@nestjs/common";
import { AttendanceStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * The deduction policy — the single named policy value of the Lesson
 * Consumption rule. PRESENT/LATE/ABSENT consume a lesson; EXCUSED does not.
 * This is the *default* Organization Policy: per-organization configuration of
 * which statuses deduct is a later slice. Never test attendance statuses
 * against scattered literals — always reference this value.
 */
export const DEDUCTING_STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT"];

/**
 * Owns the business rule "which attendance deducts a lesson" and the Derived
 * Balance query (Derived Balance is Source of Truth — company-wide default):
 *
 *   remaining = Enrollment.billingCycleSessions
 *             − COUNT(non-deleted attendance rows with a deducting status
 *                     whose ClassSession.status = COMPLETED)
 *
 * "Lesson Consumed" is a consequence of a session BEING COMPLETED, not an
 * action that runs anywhere — no stored counter exists, nothing executes at
 * completion, and corrections reverse by construction (a row corrected to
 * EXCUSED simply stops matching this COUNT). This service NEVER writes.
 */
@Injectable()
export class LessonConsumptionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consumed-lesson counts for a batch of enrollments in ONE grouped query.
   * Always batch every visible enrollmentId through this method — never issue
   * a COUNT per row (approved read-path rule: aggregate, not N+1).
   */
  async getConsumedByEnrollmentIds(enrollmentIds: string[]): Promise<Map<string, number>> {
    if (enrollmentIds.length === 0) return new Map();

    const rows = await this.prisma.attendance.groupBy({
      by: ["enrollmentId"],
      where: {
        enrollmentId: { in: enrollmentIds },
        deletedAt: null,
        status: { in: DEDUCTING_STATUSES },
        classSession: { is: { status: "COMPLETED", deletedAt: null } },
      },
      _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.enrollmentId, row._count._all]));
  }

  remainingFor(enrollment: { billingCycleSessions: number }, consumed: number): number {
    return enrollment.billingCycleSessions - consumed;
  }
}
