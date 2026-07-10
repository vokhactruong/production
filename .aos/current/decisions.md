# Active Decisions

> **Runtime version: slice-02.v9** — valid only with matching `manifest.md`.
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

RFC-001 (Operational · Provisional); A6–A12 (A11/A12 = standing Reflection questions); A7 push
rule; A8 CLI end-to-end; Scope Gate.
⟡ Pattern Candidates tracked for LESSON (4): Time-frozen Business Artifact · Evidence heals
state (×3, awaits non-School-Portal context) · Capacity FIFO · **Business Invariant → Database
Invariant** (new, Founder 2026-07-10). Knowledge Gain: scored at Reflection Meeting #2 only —
adopted-with-evidence mechanisms count, projections don't (A10 discipline).

## Stage-3 ratified during implementation

- **P3/D17 (2026-07-09):** receipt references = the PAYMENT row's own `studentId` + `billingCycleId`
  (both direct, frozen on the append-only row) — **no duplicate `receiptStudentId`/`receiptBillingCycleId`
  columns**. `receiptNumber` (from `receipt_number_seq`) is the only added receipt field. Stage-3 approved.
- **Local-DB verification (Founder-approved):** apply via `prisma migrate deploy` + shell-env override
  to local `school_portal_dev` / `school_portal_test`; never `migrate dev`, never the Supabase `.env` URL.

## Checkpoint #1 rulings (Founder, 2026-07-09)

- **R1 = BLOCKER before leaving Phase 5:** sale path P2002-PENDING conflict → if existing cycle
  is chargeless, complete its missing CHARGE idempotently from the cycle's frozen snapshot
  (Evidence heals state); real conflict (charge > 0) → throw. IT must prove idempotency under
  repeated retries (retry × N ⇒ exactly one CHARGE, one cycle).
- **BI-12 (new, REQUIREMENT.md):** no orphan cycles; self-healable = healed by the next business
  action; healing ONLY inside the business flow — never cron/job/admin-tool/startup/health-check.
- Seams #2 (refund ordering) + #3 (renewal in findOne only): approved as implemented.
- ⟡ Evidence-heals-state: 3rd occurrence recorded; ratification still waits for a non-School-Portal
  context (CRM/Booking/HRM) — Founder's stricter Rule-of-Three reading.

## Checkpoint #2 rulings (Founder, 2026-07-10)

- **Drift 1 APPROVED:** `GET /payments/summary` + `getTotalOutstanding` — additive read-only
  realization of binding-item-2's derived views; aggregation belongs on the server, never the UI.
- **Drift 2 APPROVED:** `billing.override` seeded as its own permission (Business Authority, not
  CRUD — precedent line: attendance.correct → credit.refund → billing.override). Grant:
  Receptionist + Accountant + Admin tier; RBAC-configurable. **→ CLI task: update seed + admin
  constants + gate the override UI on it.**
- **A13** third standing Reflection question (Organization Behavior evidence) — recorded in
  RFC-001 as the FINAL pre-freeze addendum.
- **RFC-001 freeze notice:** upon Meeting #2 ratification → STABLE; new improvements → RFC-002.
- **Meeting #2 opens only with real runtime evidence.** Agenda:
  `docs/slices/slice-02-payment/REFLECTION_MEETING_2.md`.

## R1 record (resolved 2026-07-09)

Sale-path chargeless-PENDING self-heal from the cycle's frozen snapshot; migration
`20260711000000_one_charge_per_cycle` (DB partial-unique = idempotent healing under concurrency);
reconcile heals renewal orphans in-flow (BI-12). IT-14 proves retry×N ⇒ exactly one cycle + one
CHARGE. Suite 38/38 green.

## Open escalations (blocking)

- **Runtime evidence for Meeting #2:** IT re-run green + seed idempotency ×2 + measured <1-min
  KPI + `billing.override` seed task — CLI, unblocked with local TEST_DATABASE_URL.
