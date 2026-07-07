-- Business correction: sessionNumber is a business identifier (like an invoice
-- or order number, e.g. teachers refer to "Session 8" as a permanent label),
-- not just a uniqueness key. It must never be reused after a session is
-- soft-deleted — reusing it would let two different physical sessions share
-- the same "Session N" label over time, which is confusing across future
-- Attendance/Payment/Reports/Audit references. Replace the partial unique
-- index (which allowed reuse after soft delete) with a full unique
-- constraint, and the application's MAX(sessionNumber) lookup must now
-- include soft-deleted rows too (see ClassSessionsRepository.findMaxSessionNumber).
--
-- Verified safe to apply: at the time of this migration, the only rows ever
-- created were smoke-test data, already cleaned up, so no duplicate
-- (classId, sessionNumber) pairs exist among soft-deleted + active rows.
DROP INDEX IF EXISTS "class_sessions_active_class_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "class_sessions_classId_sessionNumber_key" ON "class_sessions"("classId", "sessionNumber");
