# Technical Analysis — Product Slice #2: Payment (Tuition)

> **Status: APPROVED FOR IMPLEMENTATION PLANNING — Founder, 2026-07-09 (10/10).**
> All 8 ⚑ decisions approved; 4 open questions resolved; +D17/D18. See Founder decision record.
> Drafted by: **Delivery Manager (Claude CLI)**, Stage 2 owner per RFC-001 A2, using
> `playbook/templates/technical-analysis-template.md`. Format + evidence benchmark:
> `docs/slices/slice-01-attendance/TECHNICAL_ANALYSIS.md` (the Reference Slice).
> This document **proposes and flags**; it **decides nothing**. Every schema change and every
> architecture decision is marked **⚑ DECISION (approval required)** and must be approved before
> Implementation. No self-review: this draft goes to the AI Co-Architect (Stage 3) before the Founder.
>
> **Binding frame:** business rules are **upstream** of every technical option. Nothing here
> changes an approved business rule; each option is evaluated _against_ them. All of Q1–Q12,
> D13–D16, BI-1…BI-10, and the Founder sign-off additions (Receipt Number principle; credit is a
> branch inside the payment flow; TA-W1 answered from evidence) are **FINAL inputs**, not re-opened.

- **Feature:** Payment (Product Slice #2 — Revenue Collection & Balance Settlement)
- **Linked business analysis:** `docs/slices/slice-02-payment/BUSINESS_ANALYSIS.md` (APPROVED — GO, Founder 2026-07-09)
- **Linked requirement / DoD:** `docs/slices/slice-02-payment/REQUIREMENT.md` (APPROVED, decisions Q1–Q12 / D13–D16 FINAL; invariants BI-1…BI-10)
- **Analyst:** Delivery Manager (Claude CLI)

---

## 1. Summary & the pivotal question (TA-W1)

This slice turns participation evidence (Slice #1) into money: **sell a package → it becomes debt →
record payments against it → issue a receipt → derive revenue, outstanding, and credit.** No money
models exist in the schema yet (`schema.prisma` has no Payment / Receipt / Credit / BillingCycle
model; `Enrollment` snapshots only `billingCycleSessions`, `enrollments.service.ts:185`) — so this
is a genuinely new domain area, not an edit of an existing one.

**The substance of this analysis is one mandated question — TA-W1:**

> **⚑ TA-W1 — Are Payment → Receipt → Credit → Refund one aggregate or several?**
> Answered **from evidence** (Reference-Slice architecture + approved Business Rules), not DDD theory.

**Answer (analysis, §5): not four synchronized aggregates — one Payment/Billing module built on
append-only money evidence with all balances derived.** The Reference Slice already proved the
three moves this needs — _Evidence not State_, _Derived Balance is Source of Truth_
(`DATABASE.md:163-171`), and a _dependency-inverted policy seam_ (`session-completion.policy.ts:16-24`)
— and they transfer to money with **no new framework**. Concretely:

- **Payment** = append-only settlement evidence (mirrors an Attendance row).
- **Receipt** = the **permanent business identifier** minted when a payment is recorded (the
  money-side `sessionNumber`, `class-sessions.repository.ts:73-81`) — not an aggregate with its own
  lifecycle.
- **Credit** = an append-only ledger (evidence); its **balance is derived**, exactly as remaining
  lessons are derived (`lesson-consumption.service.ts:28-55`).
- **Refund** = a **status transition** on a credit-source row (NOT_REFUNDED → REFUNDED), the direct
  analogue of an attendance correction that "reverses by construction" (`attendance-application.service.ts:278-306`).

The "several aggregates need a distributed transaction to stay consistent" problem **dissolves the
same way double-deduction dissolved in Slice #1**: there are no counters to keep in sync, so
conservation of value (BI-10) is a _property of the derived views_, not of synchronized mutable
state. **This is the first Rule-of-Three test of Reference-Slice reusability, and the pattern holds.**

Two design decisions carry the weight; everything else (module shape, RBAC, API, tests) follows once
they are settled:

- **⚑ DECISION A — the money-evidence model** (one append-only financial ledger vs. several evidence
  tables; §6), which fixes the aggregate boundary in code.
- **⚑ DECISION B — snapshot pricing storage + freeze** on `Enrollment` / `BillingCycle` (§7), the
  money analogue of Slice #1's ⚑ DECISION 1.

---

## 2. Affected areas

| Layer   | Area                                                    | Change                                                                                                                              |
| ------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| DB      | `database/prisma/schema.prisma` + new migration(s)      | New money models (BillingCycle, Payment ledger, Credit ledger) + `Enrollment` snapshot-price columns. All ⚑ (schema change).        |
| API     | new `apps/api/src/payments/` module (working name)      | controller + service(s) + repository + dto, registered in `app.module.ts`. Concept-separated services (§5), Credit **inside** it.   |
| API     | `apps/api/src/enrollments/`                             | sale sets the immutable price snapshot; renewal/PENDING lifecycle; **freeze after first receipt** (D14). Reuses existing patterns.  |
| API     | `apps/api/src/attendance/lesson-consumption.service.ts` | **read-only consumer** — `remaining = 0` is the renewal trigger input. No change to its logic; Payment must not re-meter (Q2/BI-1). |
| API     | `apps/api/src/class-sessions/` (completion seam)        | _Possibly_ the point where "remaining reached 0 → create PENDING cycle" is evaluated — ⚑ trigger decision (§8). No re-metering.     |
| DB/seed | `database/prisma/seed.ts`                               | new `payment.*` / `billing.*` / `credit.*` permission codes; **Receptionist + Accountant roles do not exist yet** (§10) — ⚑.        |
| Admin   | new `apps/admin/src/features/payments/`                 | sell-package + record-payment (one <1-min flow, credit branch inline), receipts, credit/refund views. (Screen detail = Impl Plan.)  |
| Test    | `apps/api/test/invariants/`                             | new Business Invariant Tests IT-7…(BI-1…BI-10), same harness as `it-*.spec.ts` (§9).                                                |
| Docs    | `DATABASE.md`, `API.md`, `ROADMAP.md`                   | update before Done (money models, endpoints, revenue-vs-liability views).                                                           |

---

## 3. Existing patterns to reuse (reuse before inventing)

All of these are proven in the Reference Slice; none is a new framework:

- **Module shape:** copy `enrollments/` or `attendance/` — controller → service → repository → dto,
  `select`-projection record types, `{ items, meta }` list envelope (`API.md:225-244`).
- **Concept separation inside one module:** `AttendanceApplicationService` (writes evidence) vs
  `LessonConsumptionService` (derived accounting rule, never writes) —
  `attendance-application.service.ts:37-45`, `lesson-consumption.service.ts:14-28`. Payment copies
  this split: a write service for money evidence + a derived-money service for revenue/outstanding/credit.
- **Derived Balance is Source of Truth** — the company default (Founder decision, Reference Slice
  §Founder decision record #1; `DATABASE.md:163-171`). Outstanding, revenue, and credit balances are
  grouped-COUNT/SUM queries over evidence, **never stored counters** (BI-7).
- **Permanent business identifier:** `sessionNumber` is never reused, computed as `MAX(...)` across
  **all** rows including soft-deleted (`schema.prisma:458-465`, `class-sessions.repository.ts:73-81`,
  `DATABASE.md:111`). Receipt Number reuses this exact mechanism (§7A).
- **Partial-unique + `findFirst → create/update` + P2002 catch** (Prisma DSL cannot express partial
  indexes, so no `prisma.upsert`): `schema.prisma:536-542`, `attendance-application.service.ts:200-239`,
  `enrollments.service.ts:199-202`. Reused for one-ACTIVE-cycle (D13/BI-2) and renewal idempotency (BI-4).
- **Dependency-inverted cross-module seam:** `SessionCompletionPolicy` interface + `SESSION_COMPLETION_POLICY`
  Symbol token; the consumer injects only the token (`session-completion.policy.ts:16-24`,
  `class-sessions.service.ts:38-43`). If renewal must react to completion, it extends **this** seam
  rather than importing Payment into ClassSessions (§8).
- **Audit pairing on every write** with before/after `metadata`: `enrollments.service.ts:190-193,256-265`,
  `attendance-application.service.ts:208-221,260-269`. Money writes and receipts are critical business
  actions — audited without exception (BI-5; CLAUDE.md §SECURITY).
- **Permission-as-code, never a role-name check in service code** (Reference Slice §Founder decision
  record #6): `attendance.correct` is checked as a permission (`attendance-application.service.ts:28-30,72`).
- **Business Invariant Tests** harness (`apps/api/test/invariants/it-*.spec.ts`, e.g.
  `it-2-no-double-deduction.spec.ts`) — the money-safety list plugs straight in (§9).

**Reuse verdict:** no new _framework_ is needed. The only genuinely new work is a new domain area
(money models + the pro-rata/renewal/credit rules) expressed entirely through existing patterns.

---

## 4. Business rules → technical obligations (traceability)

| Approved business rule (source)                                                                                                                          | Technical obligation                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Debt exists **iff** a package sale created it; attendance never touches debt (Q1/Q2 → BI-1)                                                              | Debt is a `CHARGE` evidence row written **only** by the sale path; the consumption service stays read-only (`lesson-consumption.service.ts` unchanged).                                     |
| At most one ACTIVE billing cycle per enrollment, under concurrency (D13 → BI-2)                                                                          | Partial-unique `(enrollmentId) WHERE status='ACTIVE' AND deletedAt IS NULL` — same convention as `Enrollment` one-active (`schema.prisma:498-502`) + app guard.                             |
| Snapshot price/discount immutable after approval; hard-frozen after first receipt (Q5/Q11/Q12/D14 → BI-3, BI-8)                                          | Price columns snapshotted at sale (from `Course.basePrice`, `schema.prisma:324`); service rejects any price mutation once a receipt exists for the cycle.                                   |
| Auto-renewal is idempotent: `remaining=0` → exactly one PENDING cycle, never duplicates (Q3 → BI-4)                                                      | Idempotent single-row create guarded by a partial-unique (one non-terminal successor per enrollment) + P2002 catch; **`remaining` read from the derived count**, never re-metered.          |
| Renewal never self-activates: PENDING → ACTIVE only via payment (Q3)                                                                                     | Activation is a state transition triggered by a settling payment, not by cycle creation.                                                                                                    |
| Full + installment; study-while-owing allowed; no MVP debt cap (Q4)                                                                                      | Multiple `PAYMENT` rows may settle one cycle; no balance-based gate on attendance (BI-1 keeps them separated).                                                                              |
| Every payment produces a Receipt reusable by Parent Portal / Email later (Q8 → BI-5)                                                                     | Receipt Number = permanent identifier (§7A); receipt data shape is a stable projection, never mutated or deleted — corrections are new audited records.                                     |
| Credit arises **only** from withdrawal or overpayment; refund ledger + offset; append-only; always liability, never revenue (Q6/D16 → BI-6, BI-9, BI-10) | One append-only Credit ledger; each row traceable to its source event; balance derived; revenue view excludes credit; offset reduces owed **and** liability by the same amount (§5, §7C).   |
| Recording is manual (cash/transfer) by Receptionist/Accountant only; Teacher excluded (Q7/Q9)                                                            | New `payment.*` permission codes; **new Receptionist/Accountant roles** (⚑ §10); no Teacher grant.                                                                                          |
| Outstanding + revenue are derived from evidence — no counters to drift (BI-7)                                                                            | Grouped SUM/COUNT queries (aggregate, not N+1 — `enrollments.service.ts:39-47` pattern); no stored money counter anywhere.                                                                  |
| A PENDING cycle may consume lessons when Org Policy permits (D15); Attendance never gated by Payment                                                     | No payment check on the attendance write path; the study-in-debt default stays a named policy value (not hardcoded deeper), like `DEDUCTING_STATUSES` (`lesson-consumption.service.ts:12`). |

---

## 5. ⚑ TA-W1 — Aggregate boundaries, answered from evidence

**The DDD-theory answer** would be four aggregates — Payment, Receipt, Credit, Refund — each a
transactional consistency boundary, then a scramble to keep them synchronized (a payment must
atomically create a receipt, maybe a credit, and adjust an outstanding counter). Under this project's
pooled-connection constraint (`DATABASE.md:564-582`: interactive transactions are unreliable over
pgbouncer; "escalate true multi-row atomicity to the Architect — do not default to `$transaction`"),
that design walks straight into the documented failure mode.

**The evidence answer** comes from what the Reference Slice actually built:

1. **Evidence, not State.** Attendance rows are consequence-free evidence; the balance is a _query
   over them_ (`lesson-consumption.service.ts:14-55`, `DATABASE.md:163-171`). Money is the same:
   a **sale**, a **payment**, a **credit event** are each append-only facts. Outstanding, revenue,
   and credit balance are _queries_, not stored fields (BI-7).
2. **One module, separated concepts.** Slice #1 kept evidence-writing and the accounting rule as two
   services in one module (`attendance-application.service.ts` + `lesson-consumption.service.ts`;
   Reference Slice §Founder decision record #2). Payment mirrors this: a **write service** (records
   sale/payment/credit evidence) + a **derived-money service** (computes owed/revenue/credit/liability).
   The Founder's binding rule — _credit is a branch inside the payment flow, never a separate
   module/screen_ — is satisfied structurally: Credit is a concept **inside** the Payment module, not
   a sibling module.
3. **Receipt = permanent identifier, not an aggregate.** It has no independent lifecycle; it is a
   never-reused label minted at payment time, exactly like `sessionNumber` (§7A).
4. **Refund = status transition, not an aggregate.** NOT_REFUNDED → REFUNDED on a credit-source row
   reverses "by construction" in the derived view — the same shape as correcting an attendance row to
   a non-deducting status, which needs no reversal code (`attendance-application.service.ts:278-306`,
   `it-2-no-double-deduction.spec.ts:83-109`).

**Therefore the aggregate boundary in code is: one Payment/Billing module owning an append-only money
evidence store, with money balances derived.** Receipt, Credit, and Refund are _facets of that
evidence_ (an identifier, a ledger, a status), not separately-transacted aggregates. The four-way
"aggregate" question is really one question — _how do we shape the append-only evidence?_ — which is
**⚑ DECISION A** (§6).

**Why this is the right test to have run:** it is the first time the Reference-Slice architecture is
applied to a _different_ capability (money, not participation). It reused cleanly — no new
infrastructure, the pooled-transaction hazard side-stepped by construction, and BI-7/BI-10 satisfied
as properties of derived views. That is exactly the Rule-of-Three evidence RFC-001 ratification is
waiting on. Recorded for the Reflection/LESSON stage as high Knowledge Gain (A10).

---

## 6. ⚑ DECISION A — The money-evidence model (data model impact)

**No money models exist yet.** All of the below are schema changes and therefore ⚑ (escalation rule).
The choice is _how many evidence tables_, which is the concrete form of the TA-W1 answer.

**Common to all options (not in question):**

- **`BillingCycle`** — the unit that is sold and settled. Proposed fields: `id`, `enrollmentId` (FK),
  `status` (`PENDING | ACTIVE | COMPLETED | CANCELLED`), snapshot price fields (§7B), `sessionsSold`
  (the cap this cycle grants), `createdAt/updatedAt/deletedAt`. Partial-unique
  `(enrollmentId) WHERE status='ACTIVE' AND deletedAt IS NULL` (D13/BI-2) — reusing the `Enrollment`
  one-active convention verbatim (`schema.prisma:498-502`). _Open (§8): whether cap lives here or
  stays on `Enrollment.billingCycleSessions`._
- **Receipt Number** — a permanent identifier on settlement rows (§7A).
- **No stored money counter anywhere** (BI-7): outstanding/revenue/credit are always derived.

**Option A1 — one unified financial ledger (recommended).**
A single append-only `LedgerEntry` table of signed money events with a `type`:
`CHARGE` (sale → debt), `PAYMENT` (settlement, carries the Receipt Number + method cash/transfer),
`CREDIT_GRANT` (+liability, from withdrawal or overpayment), `CREDIT_OFFSET` (−owed & −liability on a
new purchase), `REFUND` (−liability; status transition on the granting row). Every money balance is
one grouped SUM filtered by `type`:

- `outstanding(cycle) = Σ CHARGE − Σ PAYMENT − Σ CREDIT_OFFSET` (for that cycle)
- `revenue = Σ PAYMENT` (settled) — **never** any credit type (BI-10)
- `creditBalance(student) = Σ CREDIT_GRANT − Σ CREDIT_OFFSET − Σ REFUND`

  _Pros:_ one evidence shape, one derived-query pattern, conservation-of-value (BI-10) true by
  construction (offset is a single signed row read by both the owed and liability sums — impossible to
  double-count); maximal reuse of the derived-balance pattern; BI-9 traceability trivial (every credit
  unit **is** a ledger row). _Cons:_ a `type` discriminator column; care that revenue/liability views
  never blend (enforced by the query filter + Business Invariant Tests).

**Option A2 — separate `Payment` and `Credit` tables.**
Payments in one table, credit events in another; outstanding/revenue from the first, credit balance
from the second. _Pros:_ each table narrowly typed. _Cons:_ overpayment (a payment that _becomes_
credit) now spans two tables in one flow → reintroduces the multi-row-atomicity worry the pgbouncer
constraint tells us to avoid; two derived-query patterns instead of one; conservation across tables is
a runtime property, not structural.

**Advisory recommendation (not a decision): Option A1 — the unified ledger.** It is the money-faithful
reading of "Derived Balance is Source of Truth," keeps the Founder's credit-inside-payment rule
structural, and removes the cross-table atomicity problem (overpayment → a second signed row in the
_same_ table, or derived — §7C). **⚑ Founder/Architect decides** A1 vs A2, and confirms the ledger
`type` set.

---

## 7. Mandated mechanics

### 7A. ⚑ Receipt Number — Immutable · Globally Unique · Never Reused

The Founder approved this as a **principle**; the mechanics reuse `sessionNumber` directly:

- **Generation:** `nextReceiptNumber = MAX(receiptNumber) + 1` across **all** settlement rows
  including soft-deleted — the exact discipline of `findMaxSessionNumber` (`class-sessions.repository.ts:73-81`)
  and its full (not partial) unique constraint (`schema.prisma:458-465,478`). A soft-deleted or
  corrected receipt **never** frees its number (BI-5).
- **Scope:** Receipt Number is **globally unique** (Founder: not per-enrollment) — unlike
  `sessionNumber`, which is per-class. ⚑ Confirm the sequence scope is global (one counter for the
  whole tenant) vs per-cycle. Recommendation: global, matching the Founder wording and the
  parent/audit citation use-case.
- **Format:** a human-citable string (e.g. `RC-000123`) derived from the monotonic integer; the
  integer is the invariant, the prefix is presentation. ⚑ Confirm format.
- **Test:** an IT mirroring `it-4-session-number-never-reused.spec.ts` (Receipt Number never reused
  across soft-delete/correction).

### 7B. ⚑ DECISION B — Snapshot pricing storage + freeze (D14/BI-3/BI-8)

Today `Enrollment` snapshots only the lesson cap `billingCycleSessions` from `class.sessionCount`
(`enrollments.service.ts:185`); **no price is snapshotted** and `Course.basePrice` is a live catalog
value (`schema.prisma:324`). Payment must add immutable **price + discount** snapshots (Q5/Q11/Q12):

- **Where:** on `BillingCycle` (per-cycle price, since renewal creates new cycles at possibly new
  prices) — recommended — vs on `Enrollment`. ⚑ decide.
- **Pro-rata default + override (Q5):** at sale, `snapshotPrice = proRata(Course.basePrice,
remainingSessions)` unless an authorized override is supplied. Pro-rata is a pure function of the
  snapshot inputs (basePrice, packageLessons `schema.prisma:322`, sessions remaining) — computed once,
  then frozen. ⚑ Confirm the exact pro-rata formula belongs in the TA vs the Implementation Plan.
- **Freeze after first receipt (D14, hard):** the sale/price-edit path rejects any change once a
  `PAYMENT` row (a receipt) exists for the cycle — a guard clause, not a DB trigger. BI-3 test:
  attempt price mutation after a receipt → rejected.
- **BI-8:** because price is snapshotted at sale, later `Course.basePrice` changes affect zero
  existing cycles — true by construction (no live read of `basePrice` after sale).

### 7C. ⚑ Credit branch inside the payment flow (D16 / <1-min KPI)

The Founder made credit a **branch of the single payment-recording operation**. One service call
`recordPayment(cycleId, amountReceived, method, actor)` produces, in one flow:

1. a `PAYMENT` evidence row + minted Receipt Number (always);
2. **if `amountReceived > outstanding`**, the overage becomes credit **in the same call** — no second
   screen. Under Option A1 this is one additional signed `CREDIT_GRANT` row (or, alternatively,
   overpayment-credit is _derived_ as `max(0, Σ payments − price)` and needs **no** extra write — ⚑
   sub-decision: explicit ledger row vs derived overpayment; recommendation: explicit row, for uniform
   BI-9 traceability with withdrawal-credit).

**Withdrawal credit** (mid-cycle unused value, D16) is a single `CREDIT_GRANT` row written by the
withdrawal path. **Offset** on a new purchase is a single `CREDIT_OFFSET` row that reduces owed and
liability by the same amount (BI-10, conserved by reading one row in both sums). **Refund** flips the
grant row NOT_REFUNDED → REFUNDED (a status transition, reversal by construction — §5).

**⚑ Atomicity flag:** a payment that also grants credit is _two rows that are one financial fact_ —
the one place in this slice that looks like it wants a transaction. This is precisely the "true
multi-row atomicity" case `DATABASE.md:564-582` says to **escalate, not default to `$transaction`**.
Options for the Architect: (a) derive overpayment-credit so there is only ever one write; (b) a single
guarded `INSERT ... SELECT` / constraint-backed idempotent write; (c) accept an approved narrow
`$transaction` here with the Architect's sign-off. **Flagged — not decided.**

### 7D. Derived money — revenue vs liability strictly separated (BI-7, BI-10)

The derived-money service exposes **two separate views**, never a blended number:

- **Revenue view** = `Σ PAYMENT` over settled payments (Owner's real-time revenue, Q10). Credit
  **never** appears here.
- **Liability view** = outstanding debt (per cycle/student) and outstanding credit balance (the
  center's obligation to the parent).

Reads are aggregate, not N+1 — one grouped SUM per request, following `withDerivedBalance`
(`enrollments.service.ts:39-47`) and the batching rule in `lesson-consumption.service.ts:31-51`.

---

## 8. ⚑ Renewal trigger & the completion seam (Q3/BI-4)

`remaining = billingCycleSessions − consumed` is already derived (`lesson-consumption.service.ts:53-55`).
"When remaining reaches 0, create the next cycle PENDING" needs a **trigger**, and the codebase has
**no job/scheduler and no event bus** (the same absence that ruled out Slice #1's event-driven Model B).
Options:

- **T1 — evaluate at the completion seam.** The session that consumes the last lesson is the natural
  moment. But the existing seam (`SessionCompletionPolicy`) is a **gate** (`assert...`), not a
  side-effecting hook (`session-completion.policy.ts:16-24`) — adding a write there changes its
  nature. ⚑ If chosen, extend the seam explicitly (a post-completion policy), preserving dependency
  inversion so ClassSessions still never imports Payment.
- **T2 — lazy / on-read.** Compute "needs renewal" when the enrollment/cycle is read and materialize
  the PENDING cycle then. Simplest infra-wise; renewal appears on next view rather than instantly.
- **T3 — explicit action** by staff at point of sale/collection. Most conservative; no automation.

**Idempotency (BI-4) is independent of the trigger:** a partial-unique "one non-terminal successor
cycle per enrollment" + P2002 catch guarantees exactly one PENDING cycle no matter how many times the
trigger fires — reusing `attendance-application.service.ts:222-238`. **⚑ Trigger decision flagged**
(recommendation leans T2/T3 for MVP — no new infra, no mutation smuggled into a gate; automation can
follow when evidence justifies it, per A6).

---

## 9. Business Invariant Tests (DoD-mandated — the money-safety list)

Each maps to a seam, reusing the `apps/api/test/invariants/it-*.spec.ts` harness (real services over a
test DB, e.g. `it-2-no-double-deduction.spec.ts`):

| Invariant                                                   | Test seam                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **BI-1** debt only from sale                                | attendance write path produces zero `CHARGE`/debt movement; only the sale path does.                         |
| **BI-2** ≤1 ACTIVE cycle                                    | concurrent activation → one ACTIVE row (partial-unique race, mirrors `it-5-enrollment-active-race.spec.ts`). |
| **BI-3** price frozen after receipt                         | mutate price after a `PAYMENT` exists → rejected.                                                            |
| **BI-4** renewal idempotent                                 | fire the trigger N× at `remaining=0` → exactly one PENDING cycle.                                            |
| **BI-5** receipts never deleted/mutated                     | correction creates a new audited row; Receipt Number never reused (mirrors `it-4`).                          |
| **BI-6** credit history append-only                         | refund flips status, prior grant row unchanged; history intact.                                              |
| **BI-7** money derived                                      | no counter column exists; balances = grouped SUM (schema/property test).                                     |
| **BI-8** price changes affect zero cycles                   | change `Course.basePrice` after sale → existing cycle price unchanged.                                       |
| **BI-9** credit only from withdrawal/overpayment, traceable | every credit row carries its source event; no other path writes credit.                                      |
| **BI-10** credit never revenue; offset conserves value      | revenue view excludes credit; offset lowers owed & liability by equal amount.                                |

Framework already exists (Vitest + the `support/` harness) — no new tooling decision this time
(unlike Slice #1). CI already runs the `test` step.

---

## 10. ⚑ Permissions / security — new roles required

**Finding:** the seed defines roles Super Admin, Admin, Editor, Teacher, Student, Parent
(`seed.ts:91-96`) — **there is no Receptionist and no Accountant role.** Q7/Q9 require exactly those
two as the money-recording roles. So the BA's "Receptionist gains the first money permissions" needs
a role to grant them to. ⚑ Decide:

- **R1 — create `Receptionist` + `Accountant` system roles** (recommended; matches Q9 literally and
  the SaaS role model) and grant money permissions to them + Admin tier.
- **R2 — grant money permissions to Admin only for MVP**, defer the two roles. (Contradicts Q9's
  explicit role naming — flagged as a business-rule tension, not chosen unilaterally.)

**New permission codes** (naming matches `attendance.*` / `student.*` style, `seed.ts:80-85`):
`payment.read`, `payment.create` (record a payment), `billing.create` (sell a package),
`credit.manage` / `credit.refund`, `receipt.read`. Seeded in `PERMISSIONS_SEED` and granted via
`ROLE_PERMISSIONS` (`seed.ts:99,296`). **Teacher is not granted any** (Q9) — reinforcing the
Attendance/Payment separation. ⚑ Confirm code granularity (e.g. separate `credit.refund` vs folding
into `credit.manage`) — the same granularity question raised (and answered "separate permission") for
`attendance.correct` in the Reference Slice.

- Money writes and receipts are **critical business actions** → audited without exception
  (`audit-logs.service`, BI-5); no secrets/PII logged. Minors' **financial** PII now joins behavioral
  PII — the inherited PII/retention constraint (Slice #1 LESSON.md §P7) must be resolved before any
  parent-facing exposure (Parent Portal), noted, deferred within this slice (Watch-item 3).

---

## 11. API / interface impact

- **New (all `{ items, meta }` envelope, `API.md:225-244`):**
  - `POST /billing-cycles` (`billing.create`) — sell a package: computes pro-rata (or accepts
    authorized override), writes the `CHARGE`, snapshots price. Returns the cycle.
  - `POST /payments` (`payment.create`) — record a payment against a cycle; mints the Receipt Number;
    **overpayment→credit handled inline** (§7C). One round-trip = the <1-min KPI (analogue of the
    bulk-roster endpoint that protected Slice #1's ≤10s KPI, `API.md:82`).
  - `GET /payments`, `GET /billing-cycles`, `GET /credits` — filtered, paginated reads with derived
    money fields (outstanding/revenue/credit) added additively to responses.
  - `PATCH /credits/:id` (`credit.refund`) — NOT_REFUNDED → REFUNDED status transition only.
- **No breaking changes.** Enrollment/attendance/class-session contracts are untouched; derived money
  appears as **additive** computed fields, exactly as `consumed`/`remaining` were added
  (`enrollments.service.ts:43-46`).
- **No RPC-style verbs** (API.md convention): activation is a consequence of a settling payment, not a
  `POST /cycles/:id/activate`.
- ⚑ The sell + record-payment shapes (which mint identifiers and branch into credit) are the money
  analogue of the bulk-record deviation — flagged for Architect confirmation against REST-resource style.

---

## 12. ⚑ Transaction & concurrency strategy

The binding constraint (`DATABASE.md:564-582`; production `Transaction not found` incident):
interactive transactions are unreliable over pgbouncer transaction-pooling — _"Prefer designs that do
not need multi-row atomicity: database constraints + idempotent single-row writes + derived reads …
When true multi-row atomicity is unavoidable, escalate to the Architect."_ The Reference Slice honored
this — `recordSession` is deliberately transaction-free (`attendance-application.service.ts:117-124`),
completion mutates no counters (`class-sessions.service.ts:156-161`).

Payment inherits it cleanly **because balances are derived**:

- **Sale** = one `CHARGE` write. **Payment** = one `PAYMENT` write. **Offset/refund** = one row each.
  Each is a single atomic row; idempotency comes from DB constraints + P2002 recovery
  (`attendance-application.service.ts:222-238`), not from `$transaction`.
- **One-ACTIVE-cycle** (BI-2) and **renewal idempotency** (BI-4) ride the partial-unique + app-guard
  race pattern (`schema.prisma:498-502`, `enrollments.service.ts:199-202`).
- **The single genuine multi-row case** is payment-with-overpayment-credit (§7C) — explicitly
  escalated per the DATABASE.md rule, not silently transacted.

⚑ **Decision flagged:** the atomicity strategy for payment+credit-grant (derive it away, single
guarded write, or an approved narrow transaction) is for the Architect.

---

## 13. Alternatives considered

- **Four DDD aggregates with synchronized counters** — rejected (§5): collides with the pgbouncer
  constraint and re-imports the drift/double-count class of bugs that Derived Balance exists to
  prevent. The evidence-based one-module/derived model is simpler _and_ safer.
- **Stored money counters (outstanding/revenue columns)** for read speed — rejected for MVP (BI-7;
  "measure first"). If a read hotspot is later proven, a materialized cache of the derived truth can be
  added — never as the source of truth (same posture as Slice #1's derived-vs-stored decision).
- **Separate Credit module/screen** — rejected by Founder rule (credit is a branch inside the payment
  flow) and by §5 (credit is a concept inside Payment, like LessonConsumption inside attendance).
- **Event-driven renewal (Model-B analogue)** — premature: no event infra exists and there is one
  trigger, not many consumers (A6, "no abstraction without repeated evidence"). Revisit if a second
  consumer appears.

---

## 14. Technical risks

- **Revenue/liability blend (BI-10)** — the highest-consequence invariant (BA Watch-item 2). Mitigated
  structurally by two separate derived views (§7D) + an explicit BI-10 test; a single blended query
  would be the failure mode to guard against.
- **Representation lock-in** (⚑ DECISION A) — ledger vs split tables is a migration later; decide
  deliberately, don't default. Recommendation: unified ledger (A1).
- **Renewal trigger smuggled into the completion gate** (§8) — turning an `assert` policy into a
  side-effecting write would erode the clean seam; keep it explicit or lazy.
- **Pro-rata edge cases** — joining after all sessions, rounding of `Decimal` money, override
  authorization. Contain the formula in one function; test rounding.
- **RBAC gap** (§10) — shipping money permissions without the Receptionist/Accountant roles would
  mis-model Q9; decide R1/R2 before implementation.
- **<1-min collection KPI** (BA Watch-item 1) — the inline credit branch and single-round-trip
  endpoints matter; a multi-screen credit flow would miss it. Launch gate, not nice-to-have.
- **Minors' financial PII** deepens (BA Watch-item 3) — retention model still unresolved company-wide;
  block before parent-facing exposure.

---

## 15. Architecture decisions requiring approval (consolidated — none decided here)

1. ⚑ **New money models + migration(s)** — BillingCycle, the money ledger, Enrollment/cycle price
   columns (schema change; escalation rule).
2. ⚑ **DECISION A — money-evidence model:** unified ledger (A1, recommended) vs separate Payment/Credit
   tables (A2); confirm the ledger `type` set (§6).
3. ⚑ **DECISION B — snapshot pricing:** where price/discount live (BillingCycle vs Enrollment), the
   pro-rata formula's home, and the post-receipt freeze mechanism (§7B).
4. ⚑ **Receipt Number** — global vs per-cycle scope; format; MAX-across-all-rows generation (§7A).
5. ⚑ **Credit-branch atomicity** — explicit overpayment ledger row vs derived; the multi-row write
   strategy under the pgbouncer constraint (§7C, §12).
6. ⚑ **Renewal trigger** — completion-seam (T1) vs lazy (T2) vs explicit action (T3); idempotency guard
   is settled either way (§8).
7. ⚑ **RBAC** — create Receptionist + Accountant roles (R1, recommended) vs Admin-only MVP (R2); money
   permission codes + granularity (§10).
8. ⚑ **New endpoints' shape** — sell/record-payment that mint identifiers and branch into credit,
   vs pure REST-resource style (§11).

---

## 16. Open questions / escalations

- **Pro-rata for a student joining after some sessions are already COMPLETED** — the exact question
  the Reference Slice recorded for Payment to inherit (Slice #1 TA cross-review comment #4). Snapshot
  price is computed on _remaining_ sessions at sale; confirm the "remaining" basis (calendar sessions
  left vs lessons the package grants).
- **Does an installment plan need an explicit schedule entity**, or is it simply "multiple PAYMENT rows
  until outstanding = 0"? Requirement says installments allowed (Q4) with no schedule mandate —
  assumed the latter (no schedule model) for MVP; confirm.
- **Renewal price basis** — does an auto-created PENDING renewal cycle snapshot the _then-current_
  `Course.basePrice`, or the prior cycle's price? (Q11 freezes _existing_ cycles; a _new_ cycle is a
  new snapshot — assumed current basePrice at renewal time; confirm.)
- **Credit scope** — is credit balance per-student (usable across enrollments) or per-enrollment? D16
  ("offset on a new package purchase") reads as per-student; confirm so the derived-balance grouping key
  is right.

---

## 17. Out of scope (reaffirmed)

Online payment gateways, Vietnamese e-invoice, parent-facing screens (Parent Portal), payment
reminders/notifications, payroll, per-organization policy configuration surface, credit sources beyond
withdrawal + overpayment (Requirement §Out of scope; D16). This analysis adds no capability beyond
sale → payment → receipt → derived money + credit ledger.

---

_End of Technical Analysis (DRAFT). Advisory only — proposes and flags; decides nothing. Next:
AI Co-Architect cross-review (Stage 3) → Founder approval of the ⚑ decisions → Implementation Plan
(`playbook/templates/implementation-plan-template.md`). No schema, migration, or code written in this
stage._

---

## Cross-review — AI Co-Architect (Stage 3, 2026-07-09)

**Verdict: APPROVE with one correction and three contributions.** TA-W1 is answered the way it was
mandated — from evidence, and the answer (one module + append-only ledger + derived balances) is
the faithful money-translation of the Reference-Slice architecture. Traceability table accurate;
alternatives honestly rejected; the pgbouncer constraint honored, not worked around.

**Correction (F1) — Option T3 violates a FINAL business decision; strike it.** Q3 says the next
cycle is created **"automatically"** when remaining reaches zero. T3 (explicit staff action) is
not automatic — it re-opens a FINAL Founder decision and must come off the table. The real choice
is **T1 vs T2 only**. Stage-3 recommendation: **T2 (lazy materialization on read)** — it is still
automatic (the system creates it, at read time), needs no new infra, and the idempotency guard
(partial-unique + P2002) makes racing readers safe. Caveat to record honestly: T2 makes some reads
side-effecting — the Implementation Plan must confine materialization to a small, explicit code
path (not sprinkled across queries) so the surprise is contained.

**Contribution (F2) — a fourth option for the payment+credit atomicity flag (§7C/§12):**
`createMany` writes both rows (PAYMENT + CREDIT_GRANT) in **one SQL INSERT statement** — a single
statement is implicitly atomic on Postgres **without** an interactive transaction, so the pgbouncer
hazard does not apply. This gives "two rows, one financial fact" exactly the atomicity it needs at
zero new risk. Recommend the Architect adopt **option (d): single-statement multi-row insert**,
keeping the explicit CREDIT_GRANT row (uniform BI-9 traceability) without deriving it away.

**Contribution (F3) — Receipt Number generation:** for a **global** monotonic identifier under
concurrency, a native **Postgres SEQUENCE** is simpler and safer than MAX()+1-with-retry: sequences
never reuse values (gaps on rollback are acceptable — "never reused" is the invariant, "no gaps"
was never required), and they eliminate the race entirely. `sessionNumber` used MAX() because it is
_per-class_; a global counter is exactly what sequences are for. Recommend within ⚑ #4.

**Concurrences:** DECISION A → **A1 unified ledger** (the conservation-of-value argument is
decisive); ⚑ #4 scope → **global**; ⚑ #7 → **R1** (R2 contradicts Q9, as the draft itself flags);
§16's four open questions are genuine **business** questions — they go to the Founder alongside
the ⚑ list, and none of them blocks approval of the architecture direction.

**Process note:** drafted by CLI (Stage 2), reviewed by Desktop (Stage 3) — cross-review rule
held. Approval authority for §15's 8 ⚑ decisions and §16's 4 questions remains with the Founder.

## Founder decision record (2026-07-09) — all ⚑ APPROVED; GO to Implementation Plan

1. **⚑1 Money models + migration:** APPROVED — BillingCycle, unified financial ledger, snapshot
   price, receipt. No over-engineering found.
2. **⚑2 DECISION A:** **A1 — Unified Ledger.** The most important Payment decision: Attendance
   proved Evidence → Derived Balance; Payment keeps the philosophy intact.
3. **⚑3 Snapshot pricing:** on **BillingCycle**, not Enrollment — renewal creates a new cycle with
   a new snapshot.
4. **⚑4 Receipt Number:** **Postgres SEQUENCE** (not MAX()+1) — born for exactly this problem;
   gaps are acceptable, "never reused" is the invariant.
5. **⚑5 Atomicity:** **option (d) — `createMany`, two rows in one SQL statement.** No interactive
   transaction, no pgbouncer exposure. "Simple but solid — the AOS kind of solution."
6. **⚑6 Renewal trigger:** **T2 — lazy materialization** (T3 struck: violated Q3 FINAL). Added
   constraint: materialization happens **only on the Enrollment read path** — no side effects
   scattered across other queries.
7. **⚑7 RBAC:** **R1 — create Receptionist + Accountant roles now**, no deferral.
8. **⚑8 Endpoint shape:** APPROVED — one round-trip = one payment = one receipt = one credit if any.

**Open questions resolved:**

- **OQ-A (pro-rata basis):** remaining = **remaining lessons of the package** — evidence-based
  (sessions actually taught/consumed), never calendar-based. Attendance/session evidence is the
  source of truth.
- **OQ-B (installment):** **no schedule entity** — multiple PAYMENT rows until outstanding = 0.
- **OQ-C (renewal price):** **current Course price** at renewal time — a new cycle is a new sale.
  Centers wanting the old price use the authorized override (Q5-C). Default simple, flexibility kept.
- **OQ-D (credit scope):** **Student level**, not enrollment level — offset on a new package is
  otherwise nearly impossible.

**New decisions:**

- **D17 — Receipt references Student and BillingCycle (Founder-refined wording, 2026-07-09).**
  Receipt stores a direct reference to Student and BillingCycle even though Student is derivable
  via Enrollment. This is a deliberate exception to the "never store derived data" default:
  a Receipt is a **Time-frozen Business Artifact** (like Snapshot Price) and must reference the
  student exactly as at issuance — for audit, reconciliation, and Parent Portal — even if the
  Enrollment later changes or closes. **Architecture rule attached to this exception:** it sets
  no precedent for casual denormalization; every exception to the Derived-Data default must prove
  the object is a Business Artifact requiring time-frozen immutability.

  **⟡ Pattern Candidate — "Time-frozen Business Artifact" rule (Founder, 2026-07-09; NOT yet AOS
  law per A6 — track through Slice #3/#4 before elevation):**
  _Default: never store derived data. Exception: only when the object is a Business Artifact that
  must be frozen in time._ The snapshot question stops being taste and becomes two tests —
  Is it a Business Artifact? Does it need to be time-frozen? Yes+Yes → snapshot; otherwise → derive.

  | Artifact            | Snapshot? | Why                                 |
  | ------------------- | --------- | ----------------------------------- |
  | Receipt             | ✅        | Legal/business document — immutable |
  | BillingCycle price  | ✅        | Price at transaction time must hold |
  | Enrollment snapshot | ✅        | State captured at registration      |
  | Remaining lessons   | ❌        | Always derived from Attendance      |
  | Outstanding balance | ❌        | Always derived from the Ledger      |
  | Revenue             | ❌        | Always derived from the Ledger      |

  Evidence so far: Slice #1 (Course→Class snapshots vs derived lesson balance) and Slice #2
  (BillingCycle/Receipt snapshots vs derived money). Carry into Slice #2's LESSON.md; candidate
  for elevation when CRM/Booking/ERP repeat the same law.

- **D18 — The ledger is never hard-deleted.** Soft delete or correction (compensating entry)
  only. Money never disappears.

**Founder assessment:** 10/10 — the TA did not "DDD-ify" the system; it derived Payment from
Attendance evidence. Attendance is now understood as **Reference Slice + Reference Decisions**:
it reuses not just patterns but a way of deciding.

**Post-authorization addendum (Founder, 2026-07-09 — recorded verbatim by request):**

> **"Evidence heals state."**

When state is wrong but evidence is correct, the system can always self-repair — status is
derived, evidence is truth. Observed twice now: Slice #1 (derived balance made reversal true by
construction) and Slice #2 (F2 — a paid-but-still-PENDING cycle reconciles itself from the
ledger on read). **⟡ Pattern Candidate** — not yet AOS law (A6); elevate if CRM/Booking repeat
the same law.
