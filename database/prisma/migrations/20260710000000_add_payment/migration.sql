-- CreateEnum
CREATE TYPE "BillingCycleStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CHARGE', 'PAYMENT', 'CREDIT_GRANT', 'CREDIT_OFFSET', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "CreditRefundStatus" AS ENUM ('NOT_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CreditSource" AS ENUM ('WITHDRAWAL', 'OVERPAYMENT');

-- CreateTable
CREATE TABLE "billing_cycles" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "BillingCycleStatus" NOT NULL DEFAULT 'PENDING',
    "snapshotPrice" DECIMAL(65,30) NOT NULL,
    "snapshotDiscount" DECIMAL(65,30),
    "sessionsSold" INTEGER NOT NULL,
    "note" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "studentId" TEXT NOT NULL,
    "billingCycleId" TEXT,
    "method" "PaymentMethod",
    "receiptNumber" INTEGER,
    "creditSource" "CreditSource",
    "refundStatus" "CreditRefundStatus",
    "note" TEXT,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "billing_cycles_enrollmentId_idx" ON "billing_cycles"("enrollmentId");

-- CreateIndex
CREATE INDEX "billing_cycles_status_idx" ON "billing_cycles"("status");

-- CreateIndex
CREATE INDEX "billing_cycles_deletedAt_idx" ON "billing_cycles"("deletedAt");

-- CreateIndex
-- Business rule D13/BI-2: "Only ONE ACTIVE billing cycle per enrollment."
-- Enforced at the DB level as a partial unique index scoped to live ACTIVE rows
-- only, so an enrollment may accumulate many terminal (COMPLETED/CANCELLED)
-- cycles over time but never two ACTIVE at once. Race-condition backstop behind
-- the application-level check in BillingService.
CREATE UNIQUE INDEX "billing_cycle_one_active_key" ON "billing_cycles"("enrollmentId") WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;

-- CreateIndex
-- Business rule Q3/BI-4 (Execution Authorization F1): auto-renewal must
-- materialize EXACTLY ONE PENDING successor cycle, however many times the lazy
-- read-path trigger fires. "Exactly One PENDING" is DB-protected, not
-- application-only — concurrent enrollment reads racing through
-- materializePendingCycleIfDue each attempt an insert; the loser hits P2002 on
-- this index and converts to a no-op. Companion to the ACTIVE index above.
CREATE UNIQUE INDEX "billing_cycle_one_pending_key" ON "billing_cycles"("enrollmentId") WHERE "status" = 'PENDING' AND "deletedAt" IS NULL;

-- CreateIndex
-- Receipt Number is a permanent business identifier (D17): global, never reused
-- even across soft-deletes/corrections (BI-5). A plain unique index over the
-- nullable column enforces "never reused" for issued numbers while allowing many
-- NULLs (non-PAYMENT rows carry no receipt). Values are drawn from the sequence
-- below; gaps are acceptable, reuse is not.
CREATE UNIQUE INDEX "ledger_entries_receiptNumber_key" ON "ledger_entries"("receiptNumber");

-- CreateIndex
CREATE INDEX "ledger_entries_type_idx" ON "ledger_entries"("type");

-- CreateIndex
CREATE INDEX "ledger_entries_studentId_idx" ON "ledger_entries"("studentId");

-- CreateIndex
CREATE INDEX "ledger_entries_billingCycleId_idx" ON "ledger_entries"("billingCycleId");

-- CreateIndex
CREATE INDEX "ledger_entries_deletedAt_idx" ON "ledger_entries"("deletedAt");

-- CreateSequence
-- Receipt Number generator (⚑4, Founder: "born for exactly this problem").
-- A native Postgres SEQUENCE guarantees a global monotonic identifier under
-- concurrency with no MAX()+1 race; it never reuses a value (gaps on rollback
-- are acceptable — "never reused" is the invariant, "no gaps" was never
-- required). PaymentRecordingService draws nextval('receipt_number_seq') when
-- minting a receipt on a PAYMENT ledger row.
CREATE SEQUENCE "receipt_number_seq";

-- AddForeignKey
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_billingCycleId_fkey" FOREIGN KEY ("billingCycleId") REFERENCES "billing_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
