-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('PLANNING', 'OPEN', 'FULL', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "ClassStatus" NOT NULL DEFAULT 'PLANNING',
    "capacity" INTEGER NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 15,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Partial unique index scoped to active (non-deleted) classes only, applied from
-- the start this time — see the Classroom.code fix in migration
-- 20260703010000_partial_unique_active_classroom_code for why a plain @unique/
-- full unique index is wrong here: it would permanently block reusing a
-- soft-deleted class's code, contradicting "unique active code".
CREATE UNIQUE INDEX "classes_code_active_key" ON "classes"("code") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "classes_courseId_idx" ON "classes"("courseId");

-- CreateIndex
CREATE INDEX "classes_subjectId_idx" ON "classes"("subjectId");

-- CreateIndex
CREATE INDEX "classes_classroomId_idx" ON "classes"("classroomId");

-- CreateIndex
CREATE INDEX "classes_employeeId_idx" ON "classes"("employeeId");

-- CreateIndex
CREATE INDEX "classes_status_idx" ON "classes"("status");

-- CreateIndex
CREATE INDEX "classes_isActive_idx" ON "classes"("isActive");

-- CreateIndex
CREATE INDEX "classes_deletedAt_idx" ON "classes"("deletedAt");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
