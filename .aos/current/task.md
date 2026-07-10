# Current Task

> **Runtime version: slice-02.v9** — valid only with matching `manifest.md`.
> **Responsibility:** WHAT is being worked on.

- **Feature:** Payment (Tuition) — Product Slice #2 (Capability: Revenue Collection & Balance Settlement)
- **Module / area:** database (money migration + F1 indexes), apps/api/src/payments/ (new), enrollments (sale/renewal/self-healing touchpoints), seed (R1 roles + permissions), apps/api/test/invariants/ (IT-7…IT-13), apps/admin/src/features/payments/, docs.
- **Objective (one sentence):** Implement the frozen contract — IMPLEMENTATION_PLAN.md T1–T26 + T20b — verifying at write time, phase by phase.
- **Lifecycle stage:** Implementation (stage 5)
- **Linked Playbook artifact(s):** `playbook/guides/implementation-guide.md` + `checklists/implementation-checklist.md`
- **Definition of Done (pointer):** IMPLEMENTATION_PLAN.md §Definition of Done (authoritative) — includes BI-1…BI-11 invariant tests green, gates pass, <1-min collect measured, docs updated.

## Execution reminders (from the signed contract — non-negotiable)

- **F1:** migration creates BOTH partial-uniques (one_active_key AND one_pending_key).
- **F2:** self-healing activation on the enrollment read path ("Evidence heals state") + inline fast path.
- **P1:** unsigned amounts — sign algebra only in DerivedMoneyService.
- **P3:** receipt columns on the PAYMENT row — one createMany, never a second table write.
- **P4:** capacity-based FIFO attribution — no timestamps, boundary math in DerivedMoneyService, LessonConsumptionService untouched.
- **T20b/IT-13:** BI-11 conservation property test (per-cycle and per-student equations).
- No `$transaction` on any money path; audit every money write; permission-as-code; Teacher gets nothing.
- Verification legend per task (B/L/T/IT/M); test DB `school_portal_test` exists (TEST_DATABASE_URL).
