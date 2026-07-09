# Active Decisions

> **Runtime version: slice-02.v6** — valid only with matching `manifest.md`.
> **Responsibility:** WHAT is already decided and binding.

## ❄️ THE FROZEN IMPLEMENTATION CONTRACT (Execution Authorization, 2026-07-09)

Authoritative record: `docs/slices/slice-02-payment/IMPLEMENTATION_PLAN.md` §Execution
Authorization + §Binding architecture. Changing ANY item = stop → escalate → wait.

- Business law: Q1–Q12, D13–D18; invariants **BI-1…BI-11** (BI-11: the ledger must balance).
- A1 unified ledger (CHARGE/PAYMENT/CREDIT_GRANT/CREDIT_OFFSET/REFUND), **unsigned amounts** (P1).
- BillingCycle: snapshot price frozen at sale, hard-frozen after first receipt (D14); **both**
  partial-uniques — one ACTIVE **and** one PENDING (F1) — database-protected.
- Receipt: Postgres SEQUENCE, global, RC-format, **columns on the PAYMENT row** (P3), refs Student
  - BillingCycle (D17 time-frozen artifact); never mutated/hard-deleted (D18).
- Payment+credit written in **one createMany statement**; no `$transaction` on any money path.
- Renewal: T2 lazy, Enrollment read path only, idempotent; **self-healing activation** when
  derived outstanding = 0 (F2 — "Evidence heals state"); renewal at current Course price.
- Attribution: **capacity-based FIFO** (P4) — never timestamps; boundary math in
  DerivedMoneyService; LessonConsumptionService untouched.
- Credit: student-scoped; sources = withdrawal + overpayment only; refund = status transition;
  offset conserves value (BI-10/BI-11).
- RBAC: R1 — Receptionist + Accountant roles; `credit.manage` + separate `credit.refund` (P6);
  PaymentMethod = CASH, BANK_TRANSFER (P5); Teacher excluded.
- Revenue vs liability: strictly separate derived views; aggregate queries, never N+1.

## Standing company decisions

RFC-001 (Operational · Provisional); A6–A10; A7 push rule; A8 CLI end-to-end; Scope Gate;
⟡ Pattern Candidates tracked for LESSON: Time-frozen Business Artifact; **Evidence heals state**.

## Open escalations (blocking)

- _(none — implementation is unblocked)_
