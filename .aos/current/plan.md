# Current Plan

> **Runtime version: slice-01.v8** — valid only with matching `manifest.md`.
> **Responsibility:** WHERE the work stands and what comes next. Temporary state — loaded at Boot
> Step 6. Reflects the approved implementation plan and current progress. The authoritative,
> full plan lives in the Playbook's implementation-plan artifact; this is the working pointer.

- **Plan source:** `docs/slices/slice-01-attendance/IMPLEMENTATION_PLAN.md` (APPROVED — EXECUTION AUTHORIZED, 2026-07-07; D1–D5 frozen as Implementation Contract)

## Progress

- Done: Requirement → Business Analysis → Technical Analysis → Implementation Plan (all APPROVED). Execution authorized. **Phases 1–7 code-complete** (T1–T24: schema+migration `20260709000000_add_attendance`, attendance module, Business Policy Interface + E1 hook, seed+permissions, Vitest + 6 Business Invariant Tests + CI job, admin frontend, docs) — written by supervised Desktop workers, contract-checked by Co-Architect.
- **Done: Phase 8 (T25) — Claude CLI, 2026-07-08.** Toolchain verification on host (Node 22 / pnpm 9 / native PG18):
  - `pnpm install` (vitest, unplugin-swc, @swc/core added; lockfile committed) ✓
  - `db:generate` (Prisma client incl. Attendance) ✓
  - `type-check` (8 pkgs) ✓ · `lint` **0 errors** (warnings pre-existing exhaustive-deps pattern) ✓ · `build` (@school/api) ✓
  - Migrations applied to throwaway `school_portal_test` (native PG18; docker/WSL2 unavailable — see decision note) ✓
  - **6 Business Invariant Tests / 21 cases GREEN** ✓
  - Code-level verification of items not covered by the suite: 48h window anchored to session end + `attendance.correct` (D3) ✓; RBAC seed — teacher gets read/create/update not correct ✓; derived-balance read = single grouped COUNT, no N+1 ✓; completion seam = interface+token, class-sessions never references attendance internals (D1) ✓.
  - **No in-contract defects found** — all gates + tests passed on first run; no fixes required.
  - Grouped commits (7): schema+migration / api module+seam / seed+permissions / tests+CI / admin / docs+slice artifacts / .aos+RFC-001. Branch pushed to origin.
  - **Open for Stage 3:** teacher-flow **≤10s UI KPI not measured live** (needs full stack + auth + seed against a non-prod DB); its enabler (bulk endpoint, N independent non-transactional writes) is code-verified. Also: local PG18 vs CI PG16 — CI remains the final arbiter.
- Not started: Stage-3 cross-review of Phase 8 results → Reflection → LESSON.md → **Reflection Meeting** (agenda already includes: RFC-001 ratification; the 3 pre-existing doc contradictions in DATABASE.md/API.md; pattern candidates from this slice; and the ≤10s KPI live-smoke + PG16 CI confirmation) → Done/Release → Slice #2 (Payment).

## Next step

- **Hand back to Stage 3 (Desktop review).** Phase 8 executed and pushed; Co-Architect runs the cross-review against the Runtime Contract + DoD, then Reflection.

## Supervision gates (AI Co-Architect — checked at every stage handoff)

1. Artifact/code follows the Playbook template / house conventions and lives in the right place.
2. Every architecture-affecting choice traces to the frozen Implementation Contract (D1–D5 + binding items) — anything new is escalated, never decided.
3. Business rules unchanged by technical choices.
4. Cross-review before Founder approval (drafting AI ≠ reviewing AI).
5. File-integrity check (no truncated files, git state healthy) after every runtime session — standing guard after the 2026-07-07 corruption incident.
6. **Scope Gate (Founder, 2026-07-07):** each phase asks "does this task solve the current slice's problem?" — if no, escalate (mid-cycle → Payment, not Attendance).
7. No code beyond the approved plan; no schema change beyond T1–T2; no dependency add beyond approved D2 set.
