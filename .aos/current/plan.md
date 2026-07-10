# Current Plan

> **Runtime version: slice-02.v8** — valid only with matching `manifest.md`.
> **Responsibility:** WHERE the work stands and what comes next.

- **Plan source:** `docs/slices/slice-02-payment/IMPLEMENTATION_PLAN.md` (**EXECUTION AUTHORIZED — Implementation Contract FROZEN**, Founder + Chief Architect, 2026-07-09)

## Progress

- Done: Journey → Requirement → Business Analysis (GO) → Technical Analysis (10/10) →
  Implementation Plan (26 tasks + T20b) → Stage-3 cross-review (F1/F2 corrections ratified) →
  **Execution Authorization SIGNED** (P1–P6 resolved; BI-11 added; contract frozen).
- In progress: **Implementation (CLI end-to-end, A8).**
  - **Phase 1 (DB/migration) — DONE + VERIFIED.** T1 schema: `BillingCycle` + unified `LedgerEntry`
    (P1 unsigned amount; P3 receipt cols on PAYMENT row; `CreditSource` enum for BI-9; billingCycle
    FK = RESTRICT for BI-11) + back-relations; `prisma generate` ✓, type-check ✓, lint ✓. T2
    migration `20260710000000_add_payment`: authored from Prisma's canonical offline diff + hand-added
    **F1 dual partial-uniques** + **receipt_number_seq** + receiptNumber unique. **Applied via
    `migrate deploy` to local `school_portal_dev` AND `school_portal_test`** (Founder-approved local
    PG18; `.env`/Supabase untouched — production apply is a separate release action). DB-verified:
    both partial-uniques present with correct ACTIVE/PENDING predicates, `nextval` 1→2 increasing,
    receiptNumber unique + both tables present.
  - **DB for later phases (local only):** dev `postgresql://school_test:***@localhost:5432/school_portal_dev`;
    `TEST_DATABASE_URL=postgresql://school_test:***@localhost:5432/school_portal_test`. Shell-env
    override + `prisma migrate deploy` (never `migrate dev`, never the Supabase URL).
  - **Phase 2 (payments module) — DONE (type-check + build + lint ✓).** `apps/api/src/payments/`:
    dto, repository, `DerivedMoneyService` (ledger SUMs + F2 fully-paid guard + P4 capacity-FIFO),
    `BillingService` (sale: pro-rata on remaining lessons, snapshot freeze, CHARGE row, one-PENDING
    guard), `PaymentRecordingService` (createMany PAYMENT+overpay-CREDIT_GRANT, receipt sequence,
    F2 inline activation), payment/receipt reads, controller, module, registered in app.module.
    Outstanding derived as Σ CHARGE − Σ(PAYMENT+CREDIT_OFFSET); F2 activates only fully-paid cycles.
  - **Phase 3 (credit + renewal) — DONE (type-check + build ✓).** `CreditService`: withdrawal
    (unused paid value → CREDIT_GRANT, cancels cycle), offset (CREDIT_OFFSET lowers owed+liability
    equally, BI-10), refund (REFUND row then flip grant → REFUNDED; row-first ordering + balance
    guard blocks double-refund). `BillingService.reconcile()` = T2 lazy renewal + F2 self-heal, hooked
    into `EnrollmentsService.findOne` ONLY (detail read path, idempotent, DB-partial-uniques converge).
    Credit endpoints wired; EnrollmentsModule imports PaymentsModule (no DI cycle).
  - **Phase 4 seed (R1 roles + perms) — DONE + VERIFIED on dev DB.** 8 money permission codes;
    Receptionist (sell+collect+credit.read+receipt) and Accountant (+credit.manage+credit.refund)
    roles; Admin/Super Admin get all; Teacher none. Seed idempotent (ran 2×). Admin permission
    constants (T14). type-check ✓.
  - **Phase 5 (Business Invariant Tests) — DONE + ALL GREEN.** Harness extended (payment services in
    `buildServices`, `consumeLessons` helper, money tables in reset). IT-7…IT-13: BI-1 (IT-7),
    BI-2/3/8 (IT-8), BI-4/9 (IT-9), BI-7/10 (IT-10), BI-5/6 (IT-11), ⚑5 atomicity (IT-12), BI-11
    conservation (IT-13). **Full suite 34/34 green on school_portal_test** (6 Slice-#1 regressions
    intact + 7 new). lint(src)+type-check ✓.
  - **⛳ STAGE-3 CHECKPOINT #1 — RATIFIED (Founder, 2026-07-09).** Seams #2/#3 approved.
  - **R1 BLOCKER — DONE + IT GREEN (BI-12).** Sale path P2002→PENDING now heals a _chargeless_ orphan
    from its own frozen snapshot (real conflict when charge>0 → throw); new migration
    `20260711000000_one_charge_per_cycle` (DB partial-unique) makes healing idempotent under
    concurrency; `reconcile` heals renewal orphans in-flow only (never job/cron/startup). `ensureCharge`
    helper. **IT-14 (4 cases: sequential retry×5, concurrent×6, real-conflict, renewal-orphan heal) —
    full suite 38/38 green on school_portal_test.** (Also: corrected the manifest's stale file-table
    v6→v7 and REQUIREMENT status → BI-1…BI-12.)
  - **Phase 6 (admin frontend) — DONE (type-check + lint + build ✓, both apps).**
    `apps/admin/src/features/payments/` scaffold (T21): `api/payments.api.ts`, `hooks/query-keys.ts`
    (three factories — billingCycle/payment/credit), `types.ts`, hooks `use-billing-cycles`,
    `use-payments`, `use-credits`, `use-money-summary`, `use-sell-package`, `use-record-payment`,
    `use-refund-credit` (payment/sell mutations invalidate enrollment keys — remaining/renewal is
    derived on that read path, per CACHE.md). **T22 Sell+Collect** (`pages/payments/SellAndCollect.tsx`):
    one screen — pick enrollment → sell (pro-rata computed server-side; optional sessionsSold/discount/
    override) → collect (amount+method; **overpayment→credit inline**) → receipt (printable);
    installments supported; loading/empty/error states; `<Can>` gating; **in-app KPI stopwatch**
    (enrollment-chosen → receipt-issued) renders "Hoàn tất trong Ns" for the <1-min measurement.
    **T23 Owner view** (`pages/payments/MoneyOverview.tsx`): three **strictly separate** figures —
    revenue / outstanding / credit-liability (BI-10, never blended, explicit UI note) from a new
    additive read `GET /payments/summary`; credit list + refund action (Accountant, confirm modal,
    D18-safe wording). **T24 routing**: lazy `/payments` (PAYMENT*CREATE) + `/payments/overview`
    (PAYMENT_READ) via `PermissionRoute`; two Sidebar entries. **T14 constants already existed**
    (Phase 4). \_Backend realized to serve T23 (flagged for Checkpoint #2):* `GET /payments/summary`
    (`payment.read`) + `DerivedMoneyService.getTotalOutstanding/getTotalCreditLiability` (read-only
    grouped SUMs) + credit list student-join (display only). No money-write path touched.
  - **⚠ Phase 6 verification GAP (environment blocker, not fabricated):** the local
    `TEST_DATABASE_URL` (`school_portal_test`) is **not present in this session** — only the
    production Supabase `DATABASE_URL` is configured, which the contract forbids for tests/servers.
    Local PG18 is listening on :5432 but `school_test` requires a password not available here (trust
    auth off; PG superuser off-limits per policy). Therefore **(a) the 38/38 IT re-run and (b) the
    live T22 <1-min measurement are NOT run in this session.** Phase-6 backend changes are additive
    and money-write-neutral (a display join + read-only grouped SUMs) and pass type-check + build; the
    IT re-run should still be executed by a session with local-DB access. The T22 stopwatch is wired
    so the number is captured the moment the flow is walked on a seeded local DB. **Both are the top
    Checkpoint-#2 items** — number to be recorded here once measured.
  - Then Phase 7 docs, Phase 8 gates + Reflection; Stage-3 checkpoint #2 at end of Phase 8.
    _(CLI: update this section after each phase.)_
- Not started: Stage-3 review of implementation → Testing close → Reflection → LESSON.md
  (carry ⟡ Time-frozen Business Artifact + ⟡ Evidence heals state + Knowledge Gain score) →
  **Reflection Meeting #2** (full RFC-001 ratification; P3/P4 pattern candidates second-run
  evidence) → Done/Release → Slice #3.

## Next step

- CLI session: boot via AOS.md → verify manifest (slice-02.v6) → execute Phase 1 (T1–T2, incl.
  **both** F1 partial-uniques + receipt SEQUENCE) → verify → commit → continue phase by phase.
  Push at every stopping point (A7).

## Supervision gates (Stage 3 — checked at every handoff and at the implementation review)

1. Code follows house conventions and the plan's per-task patterns. 2. Every choice traces to the
   frozen contract — anything new is escalated, never decided. 3. Business rules untouched.
2. Cross-review before Founder sign-off. 5. File-integrity + git health after every session.
3. Scope Gate each phase. 7. Push at every stopping point (A7).

## Standing open items (non-blocking)

- GitHub Actions (PG16) green — Founder confirmation still pending since Reference Slice.
- Teacher ≤10s + Collect <1-min live KPI smokes — release gates (T22/T26).
- **Supabase production baseline audit (Founder confirmed 2026-07-09: Supabase IS production).**
  `_prisma_migrations` there reports 0 applied vs 21 in-repo → before ANY deploy: check via the
  DIRECT (non-pooler) URL, diff live schema vs migrations, then baseline with
  `prisma migrate resolve --applied` — with a backup first. Implication: Slice #1 Attendance has
  likely never reached production; first real release will ship both slices together. Owner:
  release-prep session (Founder authorizes), agenda item for Reflection Meeting #2. Implementation
  continues on local PG18 unaffected.
