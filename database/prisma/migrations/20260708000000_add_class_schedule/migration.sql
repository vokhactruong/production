-- CreateTable
CREATE TABLE "class_schedules" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Business rule: "No duplicate weekday + startTime inside one Class." Scoped
-- to active (non-deleted) rows only — unlike ClassSession.sessionNumber, a
-- schedule slot isn't a permanent business identifier, so a soft-deleted
-- slot's (weekday, startTime) is free to be reused by a new slot.
CREATE UNIQUE INDEX "class_schedules_active_class_weekday_time_key" ON "class_schedules"("classId", "weekday", "startTime") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "class_schedules_classId_idx" ON "class_schedules"("classId");

-- CreateIndex
CREATE INDEX "class_schedules_deletedAt_idx" ON "class_schedules"("deletedAt");

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
