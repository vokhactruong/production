# Current Plan

> **Runtime version: slice-02.v6** — valid only with matching `manifest.md`.
> **Responsibility:** WHERE the work stands and what comes next.

- **Plan source:** `docs/slices/slice-02-payment/IMPLEMENTATION_PLAN.md` (**EXECUTION AUTHORIZED — Implementation Contract FROZEN**, Founder + Chief Architect, 2026-07-09)

## Progress

- Done: Journey → Requirement → Business Analysis (GO) → Technical Analysis (10/10) →
  Implementation Plan (26 tasks + T20b) → Stage-3 cross-review (F1/F2 corrections ratified) →
  **Execution Authorization SIGNED** (P1–P6 resolved; BI-11 added; contract frozen).
- In progress: **Implementation (CLI end-to-end, A8).**
  - **Phase 1 (DB/migration) — code COMPLETE, DB-apply BLOCKED.** T1 schema: `BillingCycle` +
    unified `LedgerEntry` (P1 unsigned amount; P3 receipt cols on PAYMENT row; `CreditSource` enum
    for BI-9; billingCycle FK = RESTRICT for BI-11) + back-relations; `prisma generate` ✓,
    type-check ✓, lint ✓. T2 migration `20260710000000_add_payment`: authored from Prisma's
    canonical offline diff + hand-added **F1 dual partial-uniques** (one_active_key + one_pending_key)
    - **receipt_number_seq** SEQUENCE + receiptNumber unique. **NOT applied:** the only configured
      DB (`DATABASE_URL`) is a remote Supabase pooler reporting 0 migrations applied — will not
      `migrate dev` against a remote DB without authorization. **Blocker: need a local dev + test
      Postgres (school_portal_test / TEST_DATABASE_URL) to apply the migration and run Phases 2–5
      invariant tests.** Escalated to Founder.
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
