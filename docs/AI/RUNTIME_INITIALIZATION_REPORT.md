# RUNTIME INITIALIZATION — IMPLEMENTATION REPORT

**PK-000 · Version 1.0 · Status: Implementation · Role: Engineering Manager**

> Connects the frozen AOS Foundation to the School Portal runtime. Implements only the integration
> layer. No redesign of AOS, Playbook, Organization, or Boot. `CLAUDE.md` was **not** modified —
> the required pointer is recorded here for approval.

---

## 1. Objective & outcome

**Objective:** let a brand-new Claude CLI session enter this repository and become productive —
within ~5 minutes, without the Founder or Chief Architect explaining the repo.

**Outcome:** the integration layer is in place and verified. A session (or the human starting it)
now has a single, discoverable entry (`AOS.md` / `pnpm aos:start`) that drives the eight-step boot
to READY, and the ownership of `.aos/current/` state is defined. **One residual step** — wiring
`CLAUDE.md` so discovery is fully automatic — is recorded for approval rather than applied, because
`CLAUDE.md` is a human-owned rules entry point (ENTRY POINT instruction: "do not modify
automatically").

---

## 2. What was built (Implementation Improvements — implemented)

| #   | Artifact                       | Purpose                                                                                                                                                                                      | Type                    |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | `AOS.md` (repo root)           | The runtime entry point: the 8-step startup, minimal reading list, and the `.aos/current/` ownership table. The canonical "start here."                                                      | Repository entry point  |
| 2   | `scripts/aos-start.mjs`        | Read-only Node helper: prints the boot reading order, checks each foundation file exists, and reports whether `.aos/current/` is populated (READY check). Zero dependencies, cross-platform. | Helper / startup script |
| 3   | `package.json` → `"aos:start"` | One-command onboarding: `pnpm aos:start`. Additive script only.                                                                                                                              | Runtime configuration   |

**Verified:** `node scripts/aos-start.mjs` runs, finds all 8 foundation targets `OK`, detects
`.aos/current/*` as `EMPTY`, and prints the correct "NOT READY — ask, don't guess" guidance.

**Not touched (frozen):** `docs/AI/*`, `docs/AOS/*`, `playbook/*`, `.aos/boot.md`, `.aos/README.md`,
`.aos/current/*` (left as clean scaffolds — no real task exists yet to populate them), and `CLAUDE.md`.

---

## 3. How it satisfies the eight startup goals

| Goal                    | Mechanism                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------- |
| 1. Identify the project | `AOS.md` step 1 → `README.md` / `/docs`; helper confirms repo.                      |
| 2. Locate AOS           | `AOS.md` names `docs/AI/`, `docs/AOS/`, `playbook/`, `.aos/`.                       |
| 3. Load Boot            | `AOS.md` step 3 + helper both point to `.aos/boot.md`.                              |
| 4. Identify role        | `.aos/current/role.md` → _only_ that role's section of `ORGANIZATION_STRUCTURE.md`. |
| 5. Load current task    | `.aos/current/task.md`.                                                             |
| 6. Load current context | `.aos/current/context.md` (+ on-demand `/docs`).                                    |
| 7. Load current plan    | `.aos/current/plan.md` (+ `decisions.md`).                                          |
| 8. Become READY         | `AOS.md` step 8 + helper READY check; halts to "ask" if state is empty.             |

Everything a session must read to start is the **minimal reading list** in `AOS.md` — foundation
background docs are explicitly deferred to on-demand, honoring "load only what is necessary."

---

## 4. Who populates `.aos/current/` (Runtime Responsibility — resolved)

Root cause **RC-B** from the validation (empty state, no owner) is addressed by defining ownership.
Populating `.aos/current/` is a **runtime act at task assignment**, not a boot act. Documented in
`AOS.md`:

| File           | Populated by                                                                                         | When                  |
| -------------- | ---------------------------------------------------------------------------------------------------- | --------------------- |
| `role.md`      | Human who starts the work (assigns the hat)                                                          | Session start         |
| `task.md`      | Assigner names feature/module/objective/stage (AI may draft from the Requirement; assigner confirms) | Task assignment       |
| `context.md`   | AI drafts minimal doc set in Technical Analysis; Architect confirms                                  | Before Implementation |
| `decisions.md` | AI records approvals/escalation answers **decided by** Founder/Architect                             | As decided            |
| `plan.md`      | AI drafts from the approved Implementation Plan                                                      | After plan approval   |

**Manual today.** This is deliberate and not over-engineered: the first real feature will exercise
it, and only then should automation be considered (see §6, EP-R2). The AI never invents a role,
task, or approval to fill a slot — empty means ask.

---

## 5. Recorded implementation work — `CLAUDE.md` pointer (NOT applied)

`CLAUDE.md` is the only file Claude auto-loads, so it is the one place that makes discovery fully
automatic (root cause **RC-A**). Per the ENTRY POINT instruction, I did **not** modify it. The exact,
minimal, additive change is recorded here for Founder/Architect approval:

**Proposed addition to `CLAUDE.md` (append; changes no existing rule):**

```markdown
## AOS Runtime

This repository operates under AOS (Adaptive Organization System).
Before doing project work, read `AOS.md` at the repository root and follow its
8-step startup (or run `pnpm aos:start`). Load only what each step names.
```

- **Why recorded, not applied:** `CLAUDE.md` is a human-owned rules entry point; it also has an
  unresolved relationship to the future Constitution (RFC-000 Open Question). Changing what every
  session auto-loads is a deliberate governance-adjacent act, not an automatic side effect.
- **Until approved:** point a new session at `AOS.md`, or run `pnpm aos:start`. Discovery works;
  it is just not yet zero-touch.

---

## 6. Improvements register

**Implementation Improvements (implemented — §2):** `AOS.md` entry point, `aos-start.mjs` helper,
`aos:start` alias, `.aos/current/` ownership definition.

**Engineering Proposals (recorded — not applied):**

| ID        | Problem                                                 | Evidence                                                  | Suggested improvement                                                                            | Expected benefit                                    | Risk                         | Arch impact | Requires Architect review                |
| --------- | ------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------- | ----------- | ---------------------------------------- |
| **EP-R1** | No auto-discovery: nothing routes a new session to AOS. | `CLAUDE.md` has zero AOS refs (AOS-VALIDATION-001, RC-A). | Append the AOS Runtime pointer to `CLAUDE.md` (§5).                                              | Zero-touch onboarding; success criterion fully met. | Low; additive.               | No          | **Yes** — human-owned rules entry point. |
| **EP-R2** | Populating `.aos/current/` is fully manual.             | §4; `.aos/current/*` empty.                               | After the first feature proves the flow, add a helper to scaffold `current/` from a Requirement. | Faster, less-error-prone task start.                | Low; premature if built now. | No          | No (implementation)                      |

**Out of scope here (already recorded in AOS-VALIDATION-001, org decisions):** proposal-channel
routing (RC-C), multi-session state isolation (RC-D), Founder deputy/succession (RC-E). These are
organization decisions, not runtime wiring — not touched.

---

## 7. Residual state & success assessment

- **With `AOS.md` + `pnpm aos:start`:** a session that is _pointed at the repo_ (the human opens it
  and says "start via AOS" or runs the command) reaches an informed, role-aware, task-ready state in
  well under 5 minutes — meeting the success criterion under AOS's human-assigns-work model.
- **Fully zero-touch discovery** additionally requires EP-R1 (`CLAUDE.md` pointer) — one approval away.
- **A genuine cold clone** still requires the foundation to be committed (FRR-001 C1 / EP-01);
  until then the integration layer exists only in the working tree. Unchanged by this sprint;
  flagged, not fixed.

---

## 8. Scope discipline

Implemented only the integration layer. Modified no foundation document, no Playbook file, no Boot
file, and not `CLAUDE.md`. The only edit to an existing tracked file is one additive `package.json`
script line. All architecture/organization items are recorded as Engineering Proposals or
references — never applied.

_End of PK-000 Runtime Initialization Report. Awaiting Founder and Chief Architect review. Not continuing automatically._
