# AOS Runtime Entry Point

**PK-000 · Runtime Initialization · Status: Implementation**

> **New Claude CLI session? Start here.** This file connects the (frozen) AOS Foundation to this
> project (School Portal) so a new session can become productive fast, without anyone explaining
> the repository.
>
> This is the **integration layer only**. It does not redesign AOS, the Playbook, the Organization,
> or the Boot Loader — it _points to_ them. Fastest path: run **`pnpm aos:start`** (a read-only
> status helper), then follow the eight steps below.

---

## What this project is

- **Runtime:** School Portal — an Education Center Management SaaS (see `/docs`).
- **Operating spec:** AOS (Adaptive Organization System) — the frozen governance/process
  foundation this session operates under.
- **This file:** the bridge between the two.

## Startup: eight steps to READY

Load only what each step needs. Do **not** load the whole repository.

| Step                    | Do                                                      | Source                                                       |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| 1. Identify the project | Confirm this repo + its docs root                       | `README.md`, `/docs`                                         |
| 2. Locate AOS           | Know where the foundation lives                         | `docs/AI/`, `docs/AOS/`, `playbook/`, `.aos/`                |
| 3. Load Boot            | Read the boot sequence & principles                     | **`.aos/boot.md`**                                           |
| 4. Identify your role   | Read your hat, then **only that role's section**        | `.aos/current/role.md` → `docs/AI/ORGANIZATION_STRUCTURE.md` |
| 5. Load current task    | Feature / module / objective / stage                    | `.aos/current/task.md`                                       |
| 6. Load current context | The minimal doc set for this task                       | `.aos/current/context.md` (+ on-demand `/docs`)              |
| 7. Load current plan    | Where the work stands / next step                       | `.aos/current/plan.md` (+ `.aos/current/decisions.md`)       |
| 8. Become READY         | You know who/what/where + binding decisions + next step | —                                                            |

If any `.aos/current/*` slot is empty or ambiguous, you are **not READY** — ask one clarifying
question; do not guess (`.aos/boot.md`).

## Minimal reading list (nothing more is required to start)

1. `AOS.md` (this file) 2. `.aos/boot.md` 3. your role's section of
   `docs/AI/ORGANIZATION_STRUCTURE.md` 4. `.aos/current/*` 5. project `/docs` **on demand**, named by
   `.aos/current/context.md`. The rest of the foundation
   (`PROJECT_ANALYSIS`, `BLUEPRINT`, `OPERATING_MODEL`, `RFC-000`) is background — read on demand, not at startup.

## How work is executed

Every feature follows the Playbook lifecycle: `playbook/feature-lifecycle.md`
(Requirement → Business Analysis → Technical Analysis → Implementation Plan → Implementation →
Review → Testing → Reflection → Lessons → Done). Use the matching template/checklist/guide per stage.

---

## Who populates `.aos/current/`

`.aos/current/*` is **temporary per-task state**. It is populated at task assignment, not by the
boot loader. Ownership (manual today — see the report for an automation recommendation):

| File           | Populated by                                                                                                  | When                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `role.md`      | The human who starts the work assigns the hat (or states it explicitly to the AI).                            | At session start.           |
| `task.md`      | The assigner names the feature/module/objective/stage (AI may draft from the Requirement; assigner confirms). | At task assignment.         |
| `context.md`   | AI drafts the minimal doc set during Technical Analysis; Architect confirms.                                  | Before Implementation.      |
| `decisions.md` | AI records approvals/escalation answers **as decided by** Founder/Architect.                                  | As decisions are made.      |
| `plan.md`      | AI drafts from the approved Implementation Plan.                                                              | After the plan is approved. |

**Rule:** the AI never invents a role, task, or approval to fill a slot. Empty slots mean _ask_.

---

## Boundaries (this layer is integration, not redesign)

- The Foundation (`docs/AI/*`, `docs/AOS/*`), the Playbook (`playbook/*`), and the Boot Loader
  (`.aos/boot.md`, `.aos/README.md`) are **frozen** here. This file and `scripts/aos-start.mjs`
  only wire them to the runtime.
- **Full auto-discovery** (a brand-new session finding AOS with no prompt) requires one small
  pointer in `CLAUDE.md` — the file Claude auto-loads. That change is **recorded for approval** in
  `docs/AI/RUNTIME_INITIALIZATION_REPORT.md`, not applied here, because `CLAUDE.md` is a
  human-owned rules entry point. Until it is approved, point a new session at this file (`AOS.md`)
  or run `pnpm aos:start`.
