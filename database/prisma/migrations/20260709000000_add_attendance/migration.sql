-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "markedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Business rule: "One Attendance record per (Enrollment × ClassSession)."
-- Attendance is participation evidence — re-submitting a roster must update the
-- existing row, never duplicate it (idempotent bulk recording), and the derived
-- lesson balance (billingCycleSessions − COUNT of deducting rows on COMPLETED
-- sessions) relies on at most one live row per key. Enforced at the DB level as
-- a partial unique index scoped to non-deleted rows only, so a soft-deleted
-- row's key can be reused while two live rows can never coexist. This is the
-- race-condition backstop behind the application-level
-- findFirst → create/update (with P2002 catch) mechanism in
-- AttendanceApplicationService.
CREATE UNIQUE INDEX "attendances_active_enrollment_session_key" ON "attendances"("enrollmentId", "classSessionId") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "attendances_enrollmentId_idx" ON "attendances"("enrollmentId");

-- CreateIndex
CREATE INDEX "attendances_classSessionId_idx" ON "attendances"("classSessionId");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_deletedAt_idx" ON "attendances"("deletedAt");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "class_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
