# Lesson — Product Slice #2: Payment (Tuition) — DRAFT

> Per `playbook/templates/lesson-template.md`. This is the ONLY place organization changes
> originate — as proposals, never direct edits. **DRAFT for Reflection Meeting #2** (Knowledge
> Gain is scored there, not here — A10).

- **Feature:** Payment (Product Slice #2 — Revenue Collection & Balance Settlement capability)
- **Date:** 2026-07-10
- **Author:** Delivery Manager (Claude CLI), from the full slice record (A8 — implementation owner)

## What happened

The second full lifecycle run, and the first with **one runtime owning implementation end-to-end**
(A8/P8): Customer Journey → Requirement → Business Analysis → Technical Analysis → Implementation
Plan → Stage-3 cross-review (F1/F2) → Execution Authorization (P1–P6 resolved, BI-11 added) →
Implementation Phases 1–8 by the CLI, verifying at write. Outcome: an append-only money ledger
with derived outstanding/revenue/credit (no counters), one-round-trip payment+credit, receipt as a
time-frozen artifact, lazy renewal + self-healing cycle status, three database-enforced
partial-uniques, and the admin Sell/Collect + Owner revenue/credit screens. 38/38 invariant tests
green (34 at Checkpoint #1 + IT-14) on `school_portal_test`; grouped commits pushed per phase (A7).

Harder than expected — and the richest material of the slice: **R1**, a partial-success failure
discovered at Checkpoint #1. A sale that created the PENDING cycle but crashed before writing its
CHARGE left an orphan that _looks valid and never crashes_ — yet the one-PENDING index then blocks
every future sale for that enrollment: a silent, permanent business deadlock. It was invisible to
type-check and to happy-path tests; only reasoning about the business timeline surfaced it.

## What we learned (evidence-based)

1. **Partial success is the real money-path failure mode — and it must self-heal in-flow.** With
   no interactive transactions allowed (the pgbouncer constraint → `createMany` single-statement
   atomicity), a crash _between_ two writes is always reachable. The lesson is not "never fail
   mid-way" (impossible here) but **"any mid-way state must be completable by the next legitimate
   business action."** R1's rule (BI-12): a self-healable state is healed by the next business
   action, **in-flow only — never a cron/job/admin-tool/startup/health-check.** The business flow
   is the only context with both the authority and the evidence to heal correctly; a background
   sweeper would be a second, scattered source of truth.
2. **"Evidence heals state" only works if the heal is idempotent by construction.** R1's fix reads
   the cycle's **own frozen snapshot** (never a freshly recomputed price) and leans on a new DB
   partial-unique `one-charge-per-cycle`, so a duplicate/retry/concurrent CHARGE is a `P2002`
   no-op: crash → retry × N ⇒ exactly one CHARGE, one cycle (IT-14, sequential ×5 + concurrent ×6).
   Idempotency was proven at the database, not hoped for in the application.
3. **"Chargeless is not invalid; orphaned-forever is."** The design distinguishes a transient
   incomplete state (fine — the next action completes it) from an un-completable one (the bug).
   That reframing is what turned a "add a transaction" instinct (unavailable) into a durable,
   constraint-friendly design.
4. **A whole class of bug is invisible to every automated gate.** "Data looks valid, nothing
   crashes, business is deadlocked" passes type-check, lint, build, and happy-path tests. It was
   caught only by a human reasoning about the business timeline (Founder, Checkpoint #1) → the IT
   requirement was strengthened to prove idempotency under **repeated** retries, not one recovery.
5. **Database-enforced business rules beat application guards for money.** Three invariants are
   partial-unique indexes, not app checks: one ACTIVE, one PENDING (F1), one CHARGE per cycle (R1).
   "Exactly one" survives concurrency because it is physics, not a code path. (Feeds A12 / ⟡#4.)
6. **Derived money made two hard problems disappear.** Revenue vs liability stay separate by
   construction (BI-10 — different queries, never a shared counter), and cross-cycle attribution is
   capacity-FIFO over current evidence, so a 48h retroactive attendance correction never rots a
   stored boundary (nothing is stored to rot). The Slice #1 → #2 handoff resolved itself.

## The Reflection question (A11 — standing, every meeting)

> **"What did this slice teach the organization about failure recovery?"** — R1 is the material.

Across two slices the Reference Slice is accumulating a coherent **Reference Failure Recovery**
doctrine, and both halves reduce to one root:

- **Attendance taught: corrections must be _retroactive_.** Evidence changes the past (PRESENT →
  EXCUSED lowers a past count) and the derived balance simply re-derives — nothing stored to
  correct.
- **Payment taught: partial success must _self-heal_.** Evidence completes the present (the missing
  CHARGE is written by the next sale from the frozen snapshot) and the cycle status re-derives —
  nothing stored to repair.
- **The root: because state is _derived from evidence_, recovery is re-derivation, not repair.**
  "Evidence heals state" — now three in-repo occurrences (attendance derived balance; payment
  fully-paid → ACTIVE reconciliation, F2; R1 orphan-CHARGE completion). Recovery therefore has an
  address — the one read/flow that re-derives — instead of being scattered across compensating
  writes.
- **Operational corollary (adopted as BI-12):** healing belongs to the next business action,
  in-flow, idempotent-by-construction; never to a background process. And the failure modes that
  matter most are the _silent_ ones — a gate that a machine can't see needs a human reasoning about
  the business timeline, which is why Checkpoint reviews exist.

## Slice Success Metrics / Definition of Done — status

- Sale = BillingCycle + CHARGE, frozen snapshot, pro-rata / override, immutable after receipt —
  **met** (T5, IT-8).
- Payment full + installment, cash/transfer, receipt (global SEQUENCE, D17), roles enforced —
  **met** (T6/T8, IT-11).
- Auto-renewal: remaining=0 → exactly one PENDING, lazy read-path, activation only via payment —
  **met** (T11, IT-9).
- Credit: withdrawal + overpayment sources; NOT_REFUNDED → REFUNDED; offset conserves owed +
  liability; append-only, never hard-deleted — **met** (T9/T10, IT-9/10/11).
- Derived, separate Owner views (revenue and liability never blended, BI-10) — **met in code**
  (`GET /payments/summary`, MoneyOverview); real-time-revenue KPI **not yet measured live**.
- All Business Invariants covered (BI-1…BI-12) — **met**, 38/38 green at Checkpoint #1 / R1.
- RBAC R1 seeded, Teacher excluded — **met** (T12/T13).
- Docs updated (DATABASE/API/ROADMAP) — **met** (Phase 7).
- Engineering gates build/lint/type-check — **met** (Phase 8: all 8 packages type-check, lint 0
  errors, api + admin build).
- **⚠ `<1-min` collect measured + invariant re-run + seed idempotency re-check — NOT run this
  session.** Environmental blocker, not a defect: the local `TEST_DATABASE_URL`
  (`school_portal_test`) is absent here (only the production Supabase URL is configured, which the
  contract forbids for tests/servers); local PG18 is up but the test role's credential is not
  available. The T22 in-app stopwatch (enrollment-chosen → receipt-issued) is wired to capture the
  number the instant the flow is walked on a seeded local DB. **Top Checkpoint-#2 items.**

## ⟡ Pattern Candidates carried (Rule of Three — tracked, not ratified; A6)

1. **Time-frozen Business Artifact (D17).** A permanent artifact of a business _moment_ (the
   Receipt; the snapshot price) stores frozen references even when derivable, because its meaning
   is "as it was then." First clear occurrence. The disciplined exception to "never store derivable
   data" — bounded, justified, non-precedent. Reuse targets: Booking receipt, CRM deal invoice, any
   priced transaction where "price at time" must hold.
2. **Evidence heals state (×3).** See the A11 answer. Founder's stricter Rule-of-Three: elevation
   waits for a **non-School-Portal** context (CRM / Booking / HRM), not a third in-repo instance.
3. **Capacity-based FIFO attribution (P4).** Consumption spread across ordered buckets up to each
   cap — a pure function of current evidence, never a stored/timestamped boundary (48h retroactive
   corrections would rot one). First occurrence. Reuse: prepaid credits, subscription tranches, POS
   multi-package.
4. _(Also tracked, from the v8 ratification)_ **Business Invariant → Database Invariant** — the
   enforcement arm of the Business Invariant Tests (the test proves, the database enforces). Two
   occurrences (Attendance + Payment); related to standing question **A12**.

## Knowledge Gain — proposed score (ratified only at Reflection Meeting #2; A10)

A10 counts **organization-level mechanisms adopted _with evidence_** — ideas and projections do not
count. By that discipline the four ⟡ Pattern Candidates above **do not count yet** (they await
Rule-of-Three / a non-School-Portal context). What this slice adopted with evidence:

1. **A11** — standing Reflection question "failure recovery" (Founder, 2026-07-09; evidence: R1).
2. **A12** — standing Reflection question "Business Rule → Database Rule" (Founder, 2026-07-10;
   evidence: DB-enforced invariants across two slices).
3. **BI-12 in-flow self-healing discipline** — "self-healable = healed by the next business action,
   in-flow only; idempotent by construction" adopted as a binding contract rule (evidence: R1 +
   IT-14 retry×N).

**Proposed Knowledge Gain = 3** (vs Attendance's 4). A stricter reading that counts only
Founder-ratified standing mechanisms yields **2** (A11, A12) — the Meeting decides whether the
BI-12 recovery discipline is an org-level mechanism or a slice invariant. Either way, lower than the
candidate count on purpose: A10 discipline means the slice's most interesting ideas (the ⟡ patterns)
score zero until a second, independent context proves them.

---

## Future RFC / disposition proposals (recorded — awaiting Architect review at Meeting #2)

**P1 — Ratify RFC-001 fully** (was PROVISIONAL). Evidence: two complete lifecycle runs; A8 removed
the verify-at-write gap in practice. Layer: AOS.

**P2 — Elevate P3 (Customer Journey before Requirement) and P4 (Capability Model) from Pattern
Candidate to adopted** — Rule of Three now met (Slice #1 + Slice #2 both practiced them). Layer:
Playbook / AOS.

**P3 — "Reference Failure Recovery" becomes a named, tracked knowledge branch** (retroactive
correction + self-healing partial success), fed by the A11 standing question — without building a
framework for it (A6). Layer: AOS knowledge, not mechanism.

**P4 — Do not elevate "Evidence heals state" yet** — three in-repo occurrences, but Founder's
stricter Rule-of-Three requires a non-School-Portal context. Keep as candidate. Layer: AOS.

**P5 — Commitlint gap:** no `test` type and no `aos`/`docs` scope in `config-conventional`; this
slice used `chore`/`docs` and an `aos` scope (warning-only). Add them so state/test commits validate
cleanly. Layer: tooling. (Carried from Checkpoint #1.)

**P6 — Contract-vs-reality drifts to reconcile at Meeting #2** (implementation-detail, surfaced by
the CLI, never self-decided): (a) `GET /payments/summary` + two `DerivedMoneyService` aggregate
reads were added in Phase 6 to serve the Owner view the DoD requires — realization of binding-item-2
derived views, flagged for ratification; (b) `billing.override` is referenced in the sell DTO but is
**not** a seeded R1 permission — the price-override UI is gated on `billing.create` (the real
authorization); confirm intended granularity.

**P7 — Supabase production baseline** (standing, from Checkpoint #1): `_prisma_migrations` reports 0
applied vs 21 in-repo; before any deploy, baseline via the direct URL with a backup. Slice #1 has
likely never reached production; first release ships both slices. Owner: release-prep session.

> The Architect decides whether these become RFCs. Recorded, not applied.
