# Current Task

> **Runtime version: slice-01.v8** — valid only with matching `manifest.md`.
> **Responsibility:** WHAT is being worked on. Temporary state — loaded at Boot Step 3.
> Names the feature, module, objective, and lifecycle stage. Does not describe how to do the
> work (that is the Playbook).

- **Feature:** Attendance — Product Slice #1 (Business Capability: Participation Management)
- **Module / area:** Whole-slice verification: apps/api (attendance, class-sessions, enrollments), database (schema/migration/seed), apps/admin (attendance feature), CI, docs
- **Objective (one sentence):** Execute Phase 8 (T25) — run all gates and Business Invariant Tests on the Phase 1–7 code, fix in-contract defects, then commit and push the slice in grouped commits.
- **Lifecycle stage:** Implementation → Testing (stages 5–7 of the Playbook lifecycle, closing pass)
- **Linked Playbook artifact(s) for this stage:** `playbook/checklists/implementation-checklist.md`, `playbook/guides/testing-guide.md`, `playbook/checklists/testing-checklist.md`
- **Definition of Done (pointer):** `docs/slices/slice-01-attendance/IMPLEMENTATION_PLAN.md` → Definition of Done checklist (authoritative), + REQUIREMENT.md DoD.

## Phase 8 run order (host toolchain required)

1. Remove stale `.git/index.lock` if present (close other git processes first).
2. `pnpm install` (new devDeps: vitest, unplugin-swc, @swc/core — lockfile will change; commit it).
3. `pnpm --filter @school/database db:generate` (generated client is stale — no Attendance model until this runs).
4. `pnpm type-check && pnpm lint && pnpm build` — fix in-contract errors; contract conflicts → escalate.
5. `docker compose up -d postgres` + create `school_portal_test` DB + `db:migrate:prod` against it.
6. `TEST_DATABASE_URL=... pnpm --filter @school/api test` — all 6 Business Invariant Tests green.
7. Manual smoke per testing-checklist: teacher flow ≤10s / E1 rejection / D4 matrix / 48h boundary / permission paths / regression on enrollments + sessions.
8. Grouped commits (schema+migration / api module+policy seam / seed+permissions / tests+CI / admin frontend / docs+slice artifacts / .aos+RFC-001), then push branch to origin.
9. Report results into `.aos/current/plan.md` Progress and hand back to Stage 3 (Desktop review).
