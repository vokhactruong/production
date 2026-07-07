-- Prisma's schema DSL cannot express partial (filtered) unique indexes, so this
-- is hand-written. The corresponding schema.prisma field is intentionally left
-- without @unique so Prisma's diff engine leaves this index alone.
--
-- Classroom.code: a full unique index blocks reusing a soft-deleted classroom's
-- code, contradicting the business rule "code unique among active classrooms".
-- Replace with a unique index scoped to active (non-deleted) classrooms only.
-- Safe to apply: a full unique constraint is strictly stronger than a partial
-- one, so no existing data can violate this.
DROP INDEX IF EXISTS "classrooms_code_key";
CREATE UNIQUE INDEX "classrooms_code_active_key" ON "classrooms"("code") WHERE "deletedAt" IS NULL;
