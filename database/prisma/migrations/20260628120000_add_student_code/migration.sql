-- AlterTable
ALTER TABLE "students" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "students_code_key" ON "students"("code");
