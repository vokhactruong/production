# Implementation Plan — Product Slice #2: Payment (Tuition)

> **Status: DRAFT — for Stage 3 cross-review (Desktop) → Execution Authorization (stage 4b, Founder + Chief Architect).**
> Drafted by: **Delivery Manager (Claude CLI)**, Stage 2 owner per RFC-001 A2, using
> `playbook/templates/implementation-plan-template.md`, extended with the three mandatory Founder
> sections (Business Capability Mapping, Business Timeline, Known Constraints).
> Format benchmark: `docs/slices/slice-01-attendance/IMPLEMENTATION_PLAN.md`.
> This plan **sequences the approved architecture; it decides nothing new** — every architecture
> item below is already approved (`TECHNICAL_ANALYSIS.md` "Founder decision record" 2026-07-09;
> `.aos/current/decisions.md`). It realizes a **Business Capability**, not merely code (Founder
> standing principle). Anything genuinely undecided (implementation-detail only) is marked
> **⚑ DECISION (approval required)** in the final section — the frozen business/architecture
> decisions are restated, never re-litigated.
>
> **A Scope Gate applies at every phase:** _"Does this task solve the current slice's problem?"_ —
> if not, escalate (e.g. per-org policy config, e-invoice → later slices, not here).

- **Feature:** Payment (Product Slice #2 — Revenue Collection & Balance Settlement)
- **Linked technical analysis:** `docs/slices/slice-02-payment/TECHNICAL_ANALYSIS.md` (APPROVED 2026-07-09, 10/10)
- **Linked requirement / DoD:** `docs/slices/slice-02-payment/REQUIREMENT.md` (APPROVED; BI-1…BI-10)
- **Planned by:** Delivery Manager (Claude CLI)

---

## Business Capability Mapping (Founder directive — document opener)

This slice realizes the company's second named **Business Capability: Revenue Collection & Balance
Settlement** — turning participation evidence (Slice #1) into money owed, collected, and accounted
for. It is the money-side proof that the Reference-Slice way of deciding generalizes: _Evidence →
Derived Balance_ becomes _Financial Evidence (Ledger) → Derived Money_.

| Aspect             | This slice's realization                                               | Future reuse of the capability                          |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| Financial evidence | Unified append-only Ledger (CHARGE/PAYMENT/CREDIT\_\*/REFUND)          | **POS** — order → charge → payment; **Membership** dues |
| Permanent artifact | Receipt (time-frozen; global sequence number; refs Student + Cycle)    | **Booking** reservation receipt; **CRM** deal invoice   |
| Derived balance    | outstanding / revenue / credit = queries over the Ledger (no counters) | **ERP** — AR/AR-aging derived from the same ledger      |
| Snapshot artifact  | BillingCycle price (frozen at sale, per D14)                           | any priced transaction where "price at time" must hold  |

Design implications honored throughout: money is **evidence, never a stored counter**
(`DATABASE.md:163-171`); the Receipt is a **Time-frozen Business Artifact** (D17 — the deliberate,
justified exception to "never store derivable data", not a precedent for casual denormalization);
credit is a **branch inside the payment flow**, not a separate module/screen (Founder, binding).

## Business Timeline (Founder directive)

The story of one package's money life — a **business timeline, not a state machine** (the only
technical state machines remain `ALLOWED_TRANSITIONS` in `class-sessions.service.ts:17-22` and the
BillingCycle status guard this plan adds).

```
 Sell package ─▶ Debt exists ─▶ Record payment ─▶ Receipt issued ─▶ [over? → Credit] ─▶ Cycle ACTIVE
 (BillingCycle   (CHARGE row,    (PAYMENT row +    (global seq #,    (CREDIT_GRANT      (activated only
  PENDING, price  outstanding    receipt in ONE    time-frozen,      row, same          by a settling
  snapshot,       derived>0)     createMany stmt)  refs Student)     createMany stmt)   payment — Q3)
  pro-rata)                                                                                     │
                                                                                                ▼
 Lessons consumed (Slice #1 evidence, unchanged) ─▶ remaining reaches 0 ─▶ next cycle materialized
                                                                            PENDING, lazily, on the
                                                                            Enrollment read path (T2)
 Withdrawal ─▶ unused value → CREDIT_GRANT      Offset ─▶ CREDIT_OFFSET reduces owed AND liability
 Refund     ─▶ credit row status → REFUNDED (money never disappears — D18; append-only — BI-6)
```

Key business readings:

- **Debt is born at sale, never at attendance** (Q1/Q2 → BI-1). The consumption service stays
  read-only; no money path writes attendance and no attendance path writes money.
- **One payment = one receipt = one credit-if-any, in one atomic SQL statement** — the `<1-minute`
  collection KPI is protected by a single round-trip (Founder ⚑8), the pgbouncer hazard avoided by
  `createMany` (one statement is atomic without an interactive transaction — Founder ⚑5).
- **Renewal is automatic but lazy** (Q3 → BI-4): the system creates the next PENDING cycle, but at
  Enrollment **read** time, not via a job or an event — confined to one explicit code path so no
  other query is secretly side-effecting (Founder ⚑6).
- **Nothing is ever a stored counter** (BI-7): outstanding, revenue, and credit balance are queries.
  **Revenue and liability are strictly separate views** (BI-10) — credit is never counted as revenue.

## Known Constraints (recorded, not solved)

- **PII / retention for minors' financial data** — Payment ties money to children's participation.
  Inherited constraint (Slice #1 LESSON.md §P7): a retention/consent model must exist **before**
  Parent Portal exposes any of this externally. Out of scope here; must not be forgotten.
- **Per-organization policy configuration** (study-in-debt default D15; deducting-status set) ships
  as a **named default value**, never hardcoded deeper; the config surface is a later slice.
- **Cross-cycle consumption attribution** — with per-cycle billing, "remaining lessons of the
  current cycle" needs an attribution boundary between an old and a renewed cycle. This is the exact
  mid-cycle question Slice #1 deferred here; its mechanics are ⚑ **P4** below (the one genuinely
  thorny integration point).
- **Out of scope (deliberately):** online payment gateways, Vietnamese e-invoice, parent-facing
  screens, reminders/notifications, payroll, credit sources beyond withdrawal + overpayment
  (REQUIREMENT §Out of scope; D16).

---

## Binding architecture (approved — restated for the implementer, not re-litigated)

From the TA Founder decision record (2026-07-09) and `.aos/current/decisions.md`. **Frozen at
Execution Authorization (4b); until then, a discovered need to change any of these = escalate, never
self-modify.**

1. **Unified Ledger (⚑2 → A1).** One append-only table `LedgerEntry` with a `type`
   ∈ {`CHARGE`, `PAYMENT`, `CREDIT_GRANT`, `CREDIT_OFFSET`, `REFUND`}. Every money balance is a
   grouped SUM over it — **no stored counter anywhere** (BI-7). Field shape is ⚑ P1.
2. **Derived money (BI-7/BI-10), two strictly separate views.**
   `outstanding(cycle) = snapshotPrice − Σ PAYMENT(cycle) − Σ CREDIT_OFFSET(cycle)`;
   `revenue = Σ PAYMENT` (never any credit type);
   `creditBalance(student) = Σ CREDIT_GRANT − Σ CREDIT_OFFSET − Σ REFUND`. Reads are **aggregate,
   never N+1** — one grouped query per request (pattern: `enrollments.service.ts:39-47`,
   `lesson-consumption.service.ts:36-51`).
3. **BillingCycle (⚑3).** `enrollmentId` FK; `status` ∈ {PENDING, ACTIVE, COMPLETED, CANCELLED};
   **snapshot price + discount** frozen at sale, hard-frozen once a receipt exists (D14/BI-3);
   `sessionsSold` (the cap this cycle grants). **Partial-unique `(enrollmentId) WHERE status='ACTIVE'
AND "deletedAt" IS NULL`** — the `Enrollment` one-active convention verbatim
   (`schema.prisma:498-502`).
4. **Receipt = Time-frozen Business Artifact (⚑1/D17).** Global **Postgres SEQUENCE** number (⚑4;
   never reused, gaps acceptable), `RC-` format; stores **direct references to Student AND
   BillingCycle** even though Student is derivable (justified exception; sets no denormalization
   precedent). Never mutated, never hard-deleted (D18/BI-5). Storage shape (columns on the PAYMENT
   ledger row vs a separate table) is ⚑ P3.
5. **Atomicity (⚑5 → option d).** A payment that also grants credit writes **both rows in one
   `createMany` INSERT statement** — atomic on Postgres without an interactive transaction (no
   pgbouncer exposure; `DATABASE.md:564-582`). The explicit `CREDIT_GRANT` row is kept (uniform BI-9
   traceability), not derived away.
6. **Snapshot pricing.** Pro-rata default = **remaining package lessons** (OQ-A; evidence-based via
   Slice #1 consumption, never calendar) × `Course.basePrice / Course.packageLessons`
   (`schema.prisma:322,324`); authorized manual override (Q5). Frozen on the BillingCycle at sale.
7. **Renewal = T2 lazy materialization (⚑6).** When derived `remaining` hits 0 and no non-terminal
   successor cycle exists, materialize the next cycle **PENDING** — **only on the Enrollment read
   path**, idempotently (partial-unique + P2002 catch, pattern
   `attendance-application.service.ts:222-238`). PENDING → ACTIVE only via a settling payment (Q3).
   Renewal price = **current** `Course.basePrice` at renewal time, override available (OQ-C).
8. **Installments = multiple PAYMENT rows** until outstanding = 0 — **no schedule entity** (OQ-B).
   Studying while owing is allowed; attendance is never gated by payment (D15/BI-1).
9. **Credit (D16).** Scope = **Student level** (OQ-D). Sources = withdrawal (unused value) and
   overpayment **only** (BI-9). Functions = refund ledger (NOT_REFUNDED → REFUNDED, a status
   transition — reversal by construction) and purchase **offset** (CREDIT_OFFSET reduces owed **and**
   liability by the same amount — conserved, BI-10). Append-only history (BI-6); ledger never
   hard-deleted (D18).
10. **RBAC = R1 (⚑7).** Create **Receptionist + Accountant** system roles now; codes
    `billing.*` / `payment.*` / `credit.*` / `receipt.*`; grant to those two + Admin tier; **Teacher
    excluded** (Q9). Permission-as-code, never role-name checks in service code
    (`attendance-application.service.ts:28-30,72`).
11. **API surface (fixed, TA §11 / ⚑8).** `POST /billing-cycles` (sell), `POST /payments` (record;
    credit inline), `GET /billing-cycles`, `GET /payments`, `GET /credits`, `PATCH /credits/:id`
    (refund). All `{ items, meta }` envelope (`API.md:225-244`); additive derived-money fields; no
    RPC verbs (activation is a consequence of a settling payment).
12. **No interactive transactions** on any money path (`createMany` single-statement + DB
    constraints + derived reads). **Audit every money write** with before/after metadata
    (`enrollments.service.ts:190-193`); money writes and receipts are critical business actions.
13. **Business Invariant Tests** (official name) map 1:1 to BI-1…BI-10. **The Vitest harness already
    exists** (`apps/api/test/invariants/`, Slice #1) and **CI already runs the `test` step** — no
    tooling decision this slice.

---

## Tasks (in order)

Verification legend: **B** = `pnpm build` · **L** = `pnpm lint` · **T** = `pnpm type-check` ·
**IT** = Business Invariant Test · **M** = manual/dev-DB check.

### Phase 1 — Database & migration

1. [ ] **Schema: money enums + models in `database/prisma/schema.prisma`.** Add
       `enum LedgerEntryType { CHARGE PAYMENT CREDIT_GRANT CREDIT_OFFSET REFUND }`,
       `enum PaymentMethod { CASH BANK_TRANSFER }` (⚑ P5),
       `enum BillingCycleStatus { PENDING ACTIVE COMPLETED CANCELLED }`,
       `enum CreditRefundStatus { NOT_REFUNDED REFUNDED }`.
       `model BillingCycle` (binding item 3): `enrollmentId` FK, `status`, `snapshotPrice Decimal`,
       `snapshotDiscount Decimal?`, `sessionsSold Int`, audit/soft-delete columns; indexes on
       `enrollmentId`, `status`, `deletedAt`; `@@map("billing_cycles")`; house doc-comment noting the
       ACTIVE partial-unique lives in raw SQL (pattern: `Enrollment` comment `schema.prisma:498-502`).
       `model LedgerEntry` (⚑ P1): `type`, `amount Decimal`, `billingCycleId?` FK, `studentId` FK,
       `method PaymentMethod?` (PAYMENT only), `receiptNumber Int?` + `receiptStudentId?` +
       `receiptBillingCycleId?` (PAYMENT only, D17 — or a separate `Receipt` model per ⚑ P3),
       `refundStatus CreditRefundStatus?` (CREDIT*GRANT only), `sourceType`/`note?`, `createdById?`,
       soft-delete + timestamps; indexes on `type`, `billingCycleId`, `studentId`, `deletedAt`;
       `@@map("ledger_entries")`. Relations back from `Enrollment`/`Student`. **No new column on
       `Enrollment`** (money is derived). \_Verify:* `pnpm db:generate`; T.
2. [ ] **Migration `20260710000000_add_payment`** (new folder; existing migrations immutable). Create
       the tables, enums, FKs (`ON DELETE RESTRICT`, house style), indexes; the **raw-SQL
       partial-unique** `CREATE UNIQUE INDEX billing_cycle_one_active_key ON "billing_cycles"("enrollmentId")
   WHERE status = 'ACTIVE' AND "deletedAt" IS NULL;` with a business-rule comment (pattern:
       `migrations/20260705000000_add_enrollment/migration.sql` active-enrollment index); and the
       **receipt SEQUENCE** `CREATE SEQUENCE receipt_number_seq;` (⚑4). _Verify:_ `pnpm db:migrate` on
       dev DB; M: two ACTIVE cycles for one enrollment → unique violation; `nextval('receipt_number_seq')`
       twice → strictly increasing.

### Phase 2 — Backend payments module (`apps/api/src/payments/`)

3. [ ] **Module skeleton:** `payments.module.ts`, `payments.controller.ts`,
       `billing.service.ts` (sale + cycle lifecycle), `payment-recording.service.ts` (record +
       credit branch), `derived-money.service.ts` (outstanding/revenue/credit — read-only, the money
       analogue of `LessonConsumptionService`), `credit.service.ts` (withdrawal grant, offset,
       refund — **inside this module**, not a sibling), `payments.repository.ts`, `dto/`. Register in
       `app.module.ts` (pattern: `AttendanceModule`, `app.module.ts:26,49`). Controller uses
       `AuthGuard` + `@RequirePermissions` + `@CurrentUser` exactly as `enrollments.controller.ts`.
       _Verify:_ B, L, T.
4. [ ] **`DerivedMoneyService` (read-only, never writes)** — the three separate derived views
       (binding item 2): `getOutstandingByCycleIds(ids)`, `getRevenue(range)`,
       `getCreditBalanceByStudentIds(ids)`, each **one grouped SUM** over `LedgerEntry` filtered by
       `type` and `deletedAt: null` (pattern: `lesson-consumption.service.ts:36-51`). Revenue query
       **must** exclude every credit type (BI-10). No writes anywhere. _Verify:_ T; IT-7, IT-10.
5. [ ] **`POST /billing-cycles` — sell a package (`billing.create`).** Steps: load enrollment
       (`deletedAt: null`; guard active student, pattern `enrollments.service.ts:49-55`); compute
       **pro-rata** from remaining package lessons (OQ-A — read consumed via
       `LessonConsumptionService.getConsumedByEnrollmentIds`) × `basePrice/packageLessons`, unless an
       authorized override is supplied (Q5); write a `CHARGE` ledger row + create the BillingCycle
       with the **frozen snapshot price/discount** and `sessionsSold`; audit. Reject a second ACTIVE
       cycle (partial-unique + P2002 → Conflict, pattern `enrollments.service.ts:199-202`).
       _Verify:_ B, T; IT-2, IT-3, IT-8; M: sell → outstanding = snapshot price.
6. [ ] **`POST /payments` — record payment + credit branch (`payment.create`).** One flow
       (binding items 5, 12): load the target cycle; compute current `outstanding` (derived);
       take `amountReceived` + `method`; obtain `receiptNumber` via `nextval('receipt_number_seq')`;
       build the rows — a `PAYMENT` entry (carrying receiptNumber + D17 student/cycle refs) and, **iff
       `amountReceived > outstanding`**, a `CREDIT_GRANT` entry for the overage — and write them in
       **one `createMany` statement** (⚑5, no `$transaction`); if the payment settles a PENDING cycle,
       transition it to ACTIVE (Q3); audit. Return the receipt + updated derived balances (one
       round-trip, <1-min KPI). _Verify:_ B, T; IT-1, IT-5, IT-9, IT-10; M: overpay → one PAYMENT +
       one CREDIT_GRANT written atomically; underpay twice → installments settle (BI: OQ-B).
7. [ ] **`GET /payments`, `GET /billing-cycles`** — filtered, paginated `{ items, meta }` reads with
       additive derived fields (outstanding on cycles; receipt data on payments), `deletedAt: null`
       discipline (pattern: `enrollments.service.ts:122-157`). `@RequirePermissions("payment.read")` /
       `billing.read`. _Verify:_ B, T; M: envelope matches existing lists.
8. [ ] **Receipt read exposure** — receipt number + time-frozen data surfaced on the payment
       response and a `GET /payments/:id` (or `/receipts/:number`) for reprint (Q8 reusable shape).
       Display-only projection; never recomputed. _Verify:_ B, T.

### Phase 3 — Credit (withdrawal · offset · refund) + lazy renewal

9. [ ] **`CreditService` — withdrawal grant + offset (`credit.manage`).** Withdrawal: on enrollment
       withdrawal, write one `CREDIT_GRANT` (unused value, `refundStatus = NOT_REFUNDED`), Student-
       scoped (OQ-D), audited. Offset: at sale/payment, apply available student credit as a
       `CREDIT_OFFSET` row that reduces owed **and** liability by the same amount (BI-10, conserved by
       construction). Each credit unit traceable to its source event (BI-9). _Verify:_ B, T; IT-6, IT-9, IT-10.
10. [ ] **`PATCH /credits/:id` — refund (`credit.refund`).** Status transition
        `NOT_REFUNDED → REFUNDED` on the CREDIT*GRANT row only — never a delete, never a value erase
        (D18/BI-6); reversal by construction (derived credit balance drops). Audit before/after.
        \_Verify:* B, T; IT-6.
11. [ ] **T2 lazy renewal — Enrollment read path ONLY (⚑6).** Add a single explicit method (e.g.
        `EnrollmentsService.materializePendingCycleIfDue`) invoked **only** inside the enrollment
        read path (`withDerivedBalance` / `findOne` / `findAll`, `enrollments.service.ts:39-47`): if
        derived `remaining === 0` and no non-terminal (PENDING/ACTIVE) successor cycle exists, create
        one **PENDING** cycle idempotently (partial-unique + P2002 catch) at **current** `basePrice`
        (OQ-C). **No other query may trigger materialization** — contained by design so the
        read-side-effect is not scattered. _Verify:_ B, T; IT-4; M: drive remaining→0 on a read →
        exactly one PENDING cycle appears; repeat reads → still exactly one.

### Phase 4 — Seed: roles & permissions (R1)

12. [ ] **`database/prisma/seed.ts` — permissions.** Add to `PERMISSIONS_SEED` (style of
        `attendance.*`, `seed.ts:80-85`): `billing.read`, `billing.create`, `payment.read`,
        `payment.create`, `credit.read`, `credit.manage`, `credit.refund`, `receipt.read`. _Verify:_
        `pnpm db:seed` idempotent (run twice).
13. [ ] **`seed.ts` — R1 new roles + grants.** Add `Receptionist` and `Accountant` to `ROLES_SEED`
        (pattern: existing entries `seed.ts:91-96`, `isSystem: true`) and to `ROLE_PERMISSIONS`
        (`seed.ts:99`): Receptionist → `billing.*`, `payment.*`, `credit.read`, `receipt.read`;
        Accountant → all of the above **plus** `credit.manage`, `credit.refund`; Super Admin + Admin →
        all. **Teacher → none** (Q9). Upsert loop untouched (`seed.ts:296`). _Verify:_ `pnpm db:seed`
        twice (idempotent); M: Receptionist can sell + collect, cannot refund; Teacher sees no money actions.
14. [ ] **`apps/admin/src/constants/permissions.ts`** — add `BILLING_*`, `PAYMENT_*`, `CREDIT_*`,
        `RECEIPT_*` constants (pattern: `ENROLLMENT_*` `:50-53`, `ATTENDANCE_*` `:63`). **Do not touch
        the stale `packages/constants` enum** (drift owned by EP-02). _Verify:_ L, T.

### Phase 5 — Business Invariant Tests (BI-1…BI-10)

Harness exists (`apps/api/test/invariants/`, real Postgres via `support/`); CI already runs it. Map
1:1 to REQUIREMENT.md invariants; extend `support/fixtures` with a billing fixture graph.

15. [ ] **IT-7 — BI-1 debt only from sale:** no attendance write path produces a CHARGE/owed movement;
        only `POST /billing-cycles` does. _(BI-1.)_
16. [ ] **IT-8 — BI-2/BI-3/BI-8 cycle + price:** concurrent sale → one ACTIVE cycle (partial-unique
        race, pattern `it-5-enrollment-active-race.spec.ts`); price mutation after a receipt exists →
        rejected (D14); `Course.basePrice` change after sale → existing cycle price unchanged.
17. [ ] **IT-9 — BI-4/BI-9 renewal + credit sources:** fire the read-path trigger N× at remaining=0 →
        exactly one PENDING cycle; every credit row traceable to withdrawal or overpayment, no other
        path writes credit. _(BI-4, BI-9.)_
18. [ ] **IT-10 — BI-7/BI-10 derived money + conservation:** outstanding/revenue/credit are grouped
        SUMs (no counter column exists); revenue view excludes all credit types; an offset lowers owed
        and liability by the equal amount (value conserved, never double-counted). _(BI-7, BI-10.)_
19. [ ] **IT-11 — BI-5/BI-6 immutability:** receipt number never reused (SEQUENCE, gaps OK but no
        reuse); a correction is a new audited row, never a mutate/delete; refund flips status without
        erasing the grant's value history; ledger has no hard-delete path (D18). _(BI-5, BI-6.)_
20. [ ] **IT-12 — atomicity (⚑5):** an overpayment writes PAYMENT + CREDIT_GRANT in one statement —
        assert both exist or neither (single-statement atomicity), and no interactive transaction is used.

### Phase 6 — Admin frontend (`apps/admin/src/features/payments/`)

21. [ ] **Feature scaffold** mirroring `features/attendance/` (`api/`, `hooks/query-keys.ts`,
        hooks): `payments.api.ts` (sell / record-payment / list / refund calls),
        `use-sell-package`, `use-record-payment`, `use-billing-cycles`, `use-payments`,
        `use-refund-credit` (mutation + invalidation per `docs/CACHE.md`; payment mutations invalidate
        enrollment keys because remaining/renewal is derived on that read path). _Verify:_ L, T.
22. [ ] **Sell + Collect screen — the `<1-minute` flow (launch gate).** One screen: choose
        enrollment → system shows pro-rata (editable with override permission) → confirm sale →
        record payment with method + amount → **overpayment handled inline** (change → credit, one
        step, no second screen) → receipt shown/printable. Single round-trip per action; loading/empty/
        error states; `<Can>` gating with the new constants. _Verify:_ B, L, T; **M: full collect flow
        measured < 1 minute** on a realistic case (Product KPI gate).
23. [ ] **Owner revenue/outstanding view + credit/refund views.** Real-time revenue and outstanding
        (derived, additive fields) for the Owner (Q10); credit balance + refund action for Accountant.
        Revenue and liability rendered as **separate figures**, never blended (BI-10). Display-only —
        no client-side money math. _Verify:_ B, L, T; M states render.
24. [ ] **Routing:** lazy routes + `PermissionRoute` registration in `App.tsx` (pattern: existing
        feature routes). _Verify:_ B; M: direct URL without permission blocked.

### Phase 7 — Documentation

25. [ ] **`docs/DATABASE.md`** — BillingCycle + LedgerEntry models, the ACTIVE partial-unique
        instance, the receipt SEQUENCE, the **derived-money rule** (no counters — extends the Derived
        Balance section), D17 exception + the **Time-frozen Business Artifact** rule (⟡ Pattern
        Candidate), D18 no-hard-delete. **`docs/API.md`** — the six endpoints, envelope, permission
        codes, the one-round-trip payment+credit flow, revenue-vs-liability views. **`docs/ROADMAP.md`**
        — Payment status. _Verify:_ docs review vs implemented behavior; L (prettier).

### Phase 8 — Final verification & close

26. [ ] **Full gates:** `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm --filter @school/api test`
        all pass; seed idempotency re-checked; **regression** of untouched flows (enrollments CRUD,
        attendance recording + completion + derived remaining, session generate/sync). Walk the DoD
        checklist item-by-item. Record **Reflection + LESSON.md** (mandatory at slice close), incl. the
        Time-frozen-Business-Artifact pattern evidence, the cross-cycle attribution outcome, and the
        Slice Success Metrics assessment (the `<1-min` collect + real-time revenue KPIs). This is the
        second full lifecycle run — capture Rule-of-Three evidence for RFC-001 ratification (Meeting #2).

## Sequence & dependencies

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
                  T4 → T9 → T10            (credit reads derived money)
      T4, T5 → T11                          (lazy renewal needs sale + derived remaining)
T3 → T12 → T13 → T14                        (codes/roles exist before UI constants)
T2, T5, T6, T9, T11 → T15..T20              (invariant tests exercise the money paths)
T7, T8, T12, T13, T14 → T21 → T22 → T23 → T24   (frontend after API + permissions)
T20, T24 → T25 → T26
```

Migrations before code; schema (T1–T2) is the root dependency. Nothing here needs a tooling decision
(Vitest + CI `test` step already exist from Slice #1).

## Data / migration steps

- **One new migration (T2):** `billing_cycles` + `ledger_entries` tables + four enums + FKs
  (`ON DELETE RESTRICT`) + indexes + **raw-SQL ACTIVE partial-unique** + **`receipt_number_seq`
  SEQUENCE**, all with business-rule comments. Existing migrations immutable — new folder only.
- **No `Enrollment` column, no backfill** — money is derived; historical correctness is a query.
- **Seed changes (T12/T13)** are additive and idempotent (upsert pattern unchanged); two new roles.
- **No data migration for renewal** — T2 lazy materialization creates cycles going forward; existing
  enrollments get a cycle on their next read.

## Test plan

**Business Invariant Tests** (T15–T20) are the core — 1:1 with BI-1…BI-10, on real Postgres (partial
index + single-statement atomicity semantics cannot be faked in-memory). Beyond invariants, per
`playbook/**/testing-checklist.md`:

- **States:** loading/empty/error on every new screen (T22/T23); envelope pagination.
- **Permission paths:** Receptionist (sell/collect, no refund), Accountant (all money incl. refund),
  Admin (all), Teacher (**no** money actions — 403/blocked), role without `payment.read` blocked.
- **Edge cases:** overpayment → credit inline; exact payment → no credit; installments (multiple
  PAYMENT rows) settle to zero; withdrawal → credit; offset conserves value; refund flips status only;
  renewal materializes exactly once at remaining=0; price frozen after first receipt.
- **Regression:** enrollments CRUD, attendance record/complete/derived-remaining, session
  generate/sync — untouched modules behave identically (T26).

## Rollout / rollback

- **Ship order = phase order**; inert until the frontend lands (endpoints permission-gated; lazy
  renewal only fires on the enrollment read path).
- **Riskiest change:** the lazy-renewal read-path side effect (T11) and money-write correctness.
  Renewal is confined to one method and idempotent; money writes are append-only and audited.
- **Rollback:** revert the app release (endpoints/renewal disappear). `billing_cycles` /
  `ledger_entries` are additive, forward-only (house convention) and can stay through a rollback —
  recorded money evidence is preserved; **no counter to unwind** (derived money is rollback-safe by
  construction). D18 guarantees nothing was hard-deleted.

## Review needs

- **Architecture review:** the migration SQL + LedgerEntry shape (⚑ P1), receipt storage (⚑ P3),
  cross-cycle attribution (⚑ P4), `createMany` atomicity mechanics (⚑5 realization) — before code.
- **Business review:** Founder confirmation that the plan sequences the approved decisions with no
  drift (Scope Gate); the `<1-min` KPI gate (T22).
- **Engineering review:** module cross-review vs `enrollments/`/`attendance/` conventions;
  no-transaction discipline on every money path; permission-as-code (no role-name checks).
- **Quality review:** Business Invariant Tests vs BI-1…BI-10 (1:1, no gaps).
- **Release review:** CI `test` green + all gates in T26; collect-<1-min measured.

## Definition of Done

Restates `REQUIREMENT.md` §Definition of Done + the BI list as the exit checklist:

- [ ] Package sale: BillingCycle + CHARGE debt with **frozen snapshot price** — pro-rata default (on
      remaining lessons), authorized override, immutable per D14 (T5, IT-8).
- [ ] Payment recording: full + installment, cash/transfer, **receipt (global SEQUENCE #, D17 refs)**
      generated with reusable shape (Q8); roles enforced (T6, T8, IT-11).
- [ ] Auto-renewal: remaining=0 → exactly one PENDING cycle, lazily on the read path; activation only
      via payment (T11, IT-9).
- [ ] Credit: creation on withdrawal AND overpayment; NOT_REFUNDED → REFUNDED; **offset** reduces
      owed + liability equally; history preserved, ledger never hard-deleted (T6/T9/T10, IT-9/IT-10/IT-11).
- [ ] PENDING-cycle consumption honored per Org Policy (D15); Attendance untouched (T5 boundary, IT-7).
- [ ] Owner views: real-time revenue and outstanding, **derived**, revenue and liability **separate**
      (T23, IT-10).
- [ ] All ten Business Invariants enforced in the service layer and covered by Business Invariant
      Tests; CI green (T15–T20, T26).
- [ ] RBAC seeded: Receptionist + Accountant roles + money permissions; Teacher excluded (T12/T13).
- [ ] Docs updated: DATABASE.md, API.md, ROADMAP.md (T25).
- [ ] Engineering gates: build/lint/type-check/test pass; existing functionality intact (T26).
- [ ] `.aos` Reflection + LESSON.md written; Product KPIs assessed; **collect-in-<1-minute measured**
      on a realistic flow before release (T22/T26).

## Open questions — ⚑ DECISIONS (implementation-detail only; nothing here re-opens a frozen decision)

- **⚑ P1 — `LedgerEntry` column shape.** _Proposal:_ a single signed `amount Decimal` with the sign
  implied/validated per `type` (CHARGE +owed, PAYMENT −owed/+revenue, CREDIT_GRANT +liability,
  CREDIT_OFFSET −owed/−liability, REFUND −liability); nullable `billingCycleId` (student-level credit
  rows may not bind a cycle), non-null `studentId`, `method` on PAYMENT only. Alternative: unsigned
  amount + direction derived purely from `type` in the query layer. Architect to confirm the column
  set + which FKs each type requires.
- **⚑ P3 — Receipt storage: columns on the PAYMENT ledger row vs a separate `Receipt` table.**
  _Proposal:_ receipt fields (`receiptNumber`, `receiptStudentId`, `receiptBillingCycleId`) as
  columns on the PAYMENT-type ledger entry — keeps "one payment = one receipt" inside the single
  `createMany` (no cross-table write, atomicity free) and satisfies D17. Alternative: a dedicated
  `Receipt` table (cleaner typing, but adds a second table to the atomic write). Architect to choose.
- **⚑ P4 — Cross-cycle consumption attribution (the inherited mid-cycle question).** With per-cycle
  billing, "remaining of the current cycle" needs a boundary between an old and a renewed cycle.
  _Proposal (MVP):_ the ACTIVE cycle's `sessionsSold` is the cap; consumption is attributed to the
  cycle active at the time each lesson is consumed (a cycle-boundary timestamp on the derived COUNT),
  keeping `LessonConsumptionService` the single source. This is the one place the Slice #1→#2 handoff
  becomes concrete — **flagged for Architect confirmation** as it touches the derived-balance seam.
- **⚑ P5 — `PaymentMethod` representation.** _Proposal:_ enum `PaymentMethod { CASH, BANK_TRANSFER }`
  on the PAYMENT ledger row (Q7). Trivial; confirm the value set for MVP.
- **⚑ P6 — `credit.manage` vs split `credit.grant`/`credit.offset` granularity.** _Proposal:_ one
  `credit.manage` (grant + offset) + a distinct `credit.refund` (money-out, Accountant-only) — same
  reasoning that gave `attendance.correct` its own code. Confirm granularity.

_(No tooling decision this slice — Vitest + CI `test` step exist from Slice #1. No renewal
scheduler/event infra — T2 is read-path only, per the frozen ⚑6.)_

---

_End of Implementation Plan (DRAFT). Next: Stage 3 cross-review (Desktop) → **Execution
Authorization (stage 4b)** — Founder + Chief Architect freeze the architecture + resolve ⚑ P1–P6 into
the Implementation Contract. No code, schema, or migration is written by this document._

---

## Cross-review — AI Co-Architect (Stage 3)

_Pending. This draft goes to Desktop (Stage 3) for cross-review before Execution Authorization; the
drafting runtime does not review its own work (RFC-001 cross-review rule)._

## Execution Authorization (stage 4b) — Founder + Chief Architect

_Pending — signature freezes the binding architecture + ⚑ P1–P6 as the Implementation Contract._
