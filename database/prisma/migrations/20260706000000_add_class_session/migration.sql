-- CreateEnum
CREATE TYPE "ClassSessionStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "status" "ClassSessionStatus" NOT NULL DEFAULT 'PLANNED',
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "topic" TEXT,
    "note" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Business rule: "Session numbers must be unique within one Class." Enforced as
-- a partial unique index scoped to active (non-deleted) rows only, so deleting a
-- session (e.g. "created for the wrong Class") frees its number back up for the
-- next auto-generated session — matching the MAX(sessionNumber)+1 algorithm,
-- which itself only considers non-deleted rows. Applied from the start here,
-- learned from the Classroom.code fix in migration
-- 20260703010000_partial_unique_active_classroom_code.
CREATE UNIQUE INDEX "class_sessions_active_class_number_key" ON "class_sessions"("classId", "sessionNumber") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "class_sessions_classId_idx" ON "class_sessions"("classId");

-- CreateIndex
CREATE INDEX "class_sessions_status_idx" ON "class_sessions"("status");

-- CreateIndex
CREATE INDEX "class_sessions_date_idx" ON "class_sessions"("date");

-- CreateIndex
CREATE INDEX "class_sessions_deletedAt_idx" ON "class_sessions"("deletedAt");

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
