# Current Task

> **Runtime version: slice-02.v4** — valid only with matching `manifest.md`.
> **Responsibility:** WHAT is being worked on.

- **Feature:** Payment (Tuition) — Product Slice #2 (Capability: Revenue Collection & Balance Settlement)
- **Module / area:** Technical Analysis only — will touch (on paper): new payment domain area, enrollments (snapshot price), attendance/lesson-consumption (read-only consumer), seed/permissions, admin frontend, invariant tests.
- **Objective (one sentence):** Produce the Technical Analysis that starts from the FINAL Business Rules and answers TA-W1 (aggregate boundaries) from Reference-Slice evidence, with every architecture decision ⚑-flagged.
- **Lifecycle stage:** Technical Analysis (stage 3)
- **Linked Playbook artifact(s):** `playbook/templates/technical-analysis-template.md`
- **Definition of Done (pointer):** REQUIREMENT.md DoD + BI-1…BI-10. Stage exit: approach reuses existing patterns; all decisions flagged, none decided.

## Mandated analyses (Founder sign-off, 2026-07-09)

1. **TA-W1:** Payment → Receipt → Credit → Refund — one aggregate or several? Answer from
   evidence (Reference Slice architecture + approved Business Rules), not DDD theory. First test
   of Reference-Slice architecture reusability.
2. **Receipt Number:** immutable, globally unique, never reused (sessionNumber precedent) —
   propose the mechanics.
3. **Credit branch:** overpayment→credit inside the single payment-recording flow (<1-min KPI).
4. **Derived money:** outstanding/revenue derived from sale+payment evidence (BI-7); revenue vs
   liability strictly separated views (BI-10).
5. Watch-items 1–4 from BUSINESS_ANALYSIS.md carried unchanged.

## Constraints

- Business rules are upstream; no technical option may alter them.
- Reuse before inventing: enrollments/attendance module patterns, partial-unique convention,
  audit pairing, no-interactive-transaction constraint (pgbouncer — verify it still binds money paths).
- End with grouped commit + push (A7).
