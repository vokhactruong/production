-- Prisma's schema DSL cannot express partial (filtered) unique indexes, so these
-- are hand-written. Do not run `prisma migrate dev` in a way that regenerates
-- this file — the corresponding schema.prisma fields are intentionally left
-- without @unique so Prisma's diff engine leaves these indexes alone.

-- User.email: soft-deleted users were permanently blocking their email from
-- reuse (full unique index does not exclude deletedAt rows). Replace with a
-- unique index scoped to active users only. Safe to apply: a full unique
-- constraint is strictly stronger than a partial one, so no existing data can
-- violate this.
DROP INDEX IF EXISTS "users_email_key";
CREATE UNIQUE INDEX "users_email_active_key" ON "users"("email") WHERE "deletedAt" IS NULL;

-- Employee.email / Employee.phone: uniqueness was only enforced in application
-- code (TOCTOU race under concurrent creation). Add database-level partial
-- unique indexes scoped to active (non-deleted) employees with a non-null
-- value. Verified against current data: no duplicate active email/phone exists.
CREATE UNIQUE INDEX "employees_email_active_key" ON "employees"("email") WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;
CREATE UNIQUE INDEX "employees_phone_active_key" ON "employees"("phone") WHERE "deletedAt" IS NULL AND "phone" IS NOT NULL;
