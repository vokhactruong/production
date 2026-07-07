-- CreateEnum
CREATE TYPE "ClassroomType" AS ENUM ('PHYSICAL', 'ONLINE', 'LAB');

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ClassroomType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_code_key" ON "classrooms"("code");

-- CreateIndex
CREATE INDEX "classrooms_type_idx" ON "classrooms"("type");

-- CreateIndex
CREATE INDEX "classrooms_isActive_idx" ON "classrooms"("isActive");

-- CreateIndex
CREATE INDEX "classrooms_deletedAt_idx" ON "classrooms"("deletedAt");
