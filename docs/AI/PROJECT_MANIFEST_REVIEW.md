# PROJECT MANIFEST REVIEW

**PRJ-000 · Version 1.0 · Status: Review · Role: Engineering Manager**

> Scope: validate whether `AOS.md` (the AI Project Manifest) correctly connects this repository to
> the AOS Foundation, such that a brand-new AI runtime can start working **using only `AOS.md`**.
> This reviews the _manifest_, not AOS, the Playbook, or Boot. No file was modified.
>
> Bias disclosure: this protects the runtime experience, not prior work (which I authored). Where
> the manifest works, it is stated plainly; where a cold runtime would stall, that is stated with
> evidence. Method: simulate a new runtime following `AOS.md` verbatim.

---

## Central finding first (it drives several areas)

**The manifest content is good; its _discovery_ is not wired.** The objective — "start using ONLY
`AOS.md`" — presupposes the runtime is already reading `AOS.md`. Nothing makes that happen:

- **Claude CLI** auto-loads `CLAUDE.md`, which contains **zero references** to `AOS.md`, `.aos`,
  boot, or the Playbook (it instructs "read the relevant documentation in `/docs`" and its own
  rules). A Claude session therefore follows `CLAUDE.md` and **never learns `AOS.md` exists**. The
  `CLAUDE.md` pointer that would fix this was deliberately _recorded, not applied_ (PK-000 §5 /
  EP-R1).
- **Gemini CLI, Codex CLI, Cursor** each have their **own** native entry conventions
  (e.g. `GEMINI.md`, `AGENTS.md`, `.cursor/rules`). None exist here, and none reference `AOS.md`.

So today, **no runtime auto-discovers `AOS.md`.** It is reachable only when a human points to it or
runs `pnpm aos:start`. This does not mean the manifest is wrong — it means the _last mile of
discovery_ is unwired. That distinction shapes every score below.

---

## Validation Areas

### 1. Project Identity — **PASS**

`AOS.md` states the project (School Portal), its purpose (Education Center Management SaaS), and
routes scope to `/docs`. Name and purpose are explicit; scope is _referenced_ rather than inlined —
the correct choice (one source of truth; don't duplicate `/docs`). A new AI can answer "what is
this project" from `AOS.md` alone.

### 2. Entry Point — **PASS (with a discovery caveat that belongs to Area 7)**

As a _first document_, `AOS.md` is sufficient: it routes to Boot, the role source, current state,
the Playbook lifecycle, and `/docs`. Nothing critical is missing _inside_ it. The only "missing"
piece is how the runtime arrives at `AOS.md` in the first place — covered in Area 7. Interpreting
"only `AOS.md`" as "`AOS.md` is the single required _entry_ document that routes to the rest"
(not "never read anything else"), it holds.

### 3. Boot Integration — **PASS**

`AOS.md` links `.aos/boot.md` (Boot), `.aos/current/*` (Current State), and
`playbook/feature-lifecycle.md` (Playbook) explicitly and unambiguously. A runtime can discover all
three from the manifest without guessing.

### 4. Runtime Initialization (READY in 5 min) — **PARTIAL**

A runtime _reading_ `AOS.md` can become **oriented** (project, org, its role concept, where work
and state live, the lifecycle) in well under five minutes. It **cannot become task-READY**, because
`.aos/current/*` is empty and, per `AOS.md`/`boot.md`, empty slots mean "not READY — ask." This is
_by design_ (human assigns work), but it means "productive" = _oriented and ready to be assigned_,
not _autonomously executing a feature_. Honest result: orientation PASS, autonomous task-start FAIL,
net PARTIAL.

### 5. Current State ownership & lifecycle — **PASS (minor gap)**

`AOS.md` has a clear ownership table (who populates `role`/`task`/`context`/`decisions`/`plan`, and
when) plus the rule "empty means ask; never invent." Understandable and unambiguous. **Minor gap:**
`AOS.md` says `current/` is "temporary per-task state" but does not say _when it is cleared/reset_
at feature end — `boot.md` mentions this, `AOS.md` does not. A one-line pointer would close it.

### 6. Knowledge Navigation (load / do-NOT-load) — **PASS**

`AOS.md` gives a minimal reading list and _explicitly_ names what **not** to load at startup:
"the rest (`PROJECT_ANALYSIS`, `BLUEPRINT`, `OPERATING_MODEL`, `RFC-000`) is background — read on
demand, not at startup." This is exactly the "load only what is necessary" discipline; strong PASS.

### 7. Discoverability (find everything without asking the Founder) — **FAIL**

This is the decisive gap (see Central Finding). A _completely new_ runtime does not auto-find
`AOS.md`: `CLAUDE.md` doesn't reference it; no `GEMINI.md`/`AGENTS.md`/Cursor rules exist; the
`CLAUDE.md` pointer is recorded, not applied. Therefore a cold runtime **must be told** to read
`AOS.md` — i.e., it cannot find everything "without asking." Once pointed, discovery from `AOS.md`
onward is fine. The failure is strictly the _first hop_.

### 8. Runtime Simplicity — **PASS (simplifiable)**

`AOS.md` is lean and readable; no architectural over-complexity. Two minor, non-architectural
simplifications exist (see II-1, II-2): the 8-step table and the "minimal reading list" paragraph
overlap (the same files listed twice), and `AOS.md`'s **8-step** sequence differs in granularity
from `boot.md`'s **6-step** sequence — not contradictory, but a reader crossing between them meets
two numberings. Simplifiable without touching architecture.

### 9. Cross-Runtime Compatibility — **PARTIAL**

- **Content: compatible.** `AOS.md` is plain, runtime-neutral Markdown with generic instructions;
  any runtime that _reads_ it can follow it.
- **Discovery: not compatible.** Each runtime has a different native entry convention and none point
  to `AOS.md` (Area 7). So the manifest works cross-runtime only _after_ a per-runtime pointer is
  added.
- **Helper caveat:** `pnpm aos:start` assumes Node/pnpm are present (true here). A "future runtime"
  lacking Node could still read `AOS.md` but not run the helper — acceptable, since the helper is a
  convenience, not the manifest. Net PARTIAL: the manifest is portable; the _entry wiring_ must be
  provided per runtime.

### 10. Long-Term Maintainability (100 modules / 50 contributors / 5 products) — **PARTIAL**

- **Manifest content scales.** `AOS.md` is pointer-based and enumerates no modules, so 100 modules
  don't touch it; project-agnostic, so it survives new products structurally.
- **Two known limits (already recorded, out of scope to fix here):** a single shared `.aos/current/`
  collides for **50 concurrent contributors/runtimes** (AOS-VALIDATION-001 RC-D), and the single
  "Identify the project" + single `current/` assumes **one product at a time** — 5 products need
  per-product manifests or namespacing. These are organization decisions, not manifest-content
  defects. Net PARTIAL, referencing existing findings; no new redesign implied.

**Tally:** PASS ×6 (1, 2, 3, 5, 6, 8) · PARTIAL ×3 (4, 9, 10) · FAIL ×1 (7).

---

## Engineering Improvements

**Implementation Improvements (recommended — additive, no change to Business/Architecture/Org/
Governance/AOS/Playbook/Boot; recorded here only, as this task creates no files but the report):**

- **II-1 — De-duplicate `AOS.md`'s startup lists.** The 8-step table and the "minimal reading list"
  paragraph list the same files. Collapse to one. _Benefit:_ less reading, one source. _Recommend for a follow-up edit to `AOS.md` (not done here — non-goal forbids modifying it)._
- **II-2 — Reconcile step counts + note reset.** Align `AOS.md`'s 8-step and `boot.md`'s 6-step
  framing (or cross-note the mapping), and add a one-line "when `current/` is cleared" pointer to
  `AOS.md`. _Benefit:_ removes reader confusion; closes the Area 5 minor gap.
- **II-3 — Per-runtime discovery pointers.** Add tiny native-entry files that each say "read
  `AOS.md`": apply the recorded `CLAUDE.md` pointer (EP-R1), and add `GEMINI.md` / `AGENTS.md` /
  `.cursor/rules` equivalents **if** those runtimes are to be supported. _Benefit:_ fixes Area 7 /
  Area 9 discovery. _Additive runtime config; implement in a follow-up implementation task, not a review._

**Engineering Proposals (architecture/governance — recorded, require Architect review):**

| ID        | Problem                                                                                                                                                | Evidence                                                               | Suggested improvement                                                                                                                        | Expected benefit                    | Risk                           | Arch impact                | Requires Architect review |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------ | -------------------------- | ------------------------- |
| **EP-M1** | Dual, disconnected manifests: `CLAUDE.md` (auto-loaded, AOS-unaware) vs `AOS.md` (AOS entry, not auto-loaded). A Claude session bypasses AOS entirely. | `CLAUDE.md` has no AOS refs; pointer recorded not applied (PK-000 §5). | Decide how `CLAUDE.md` and `AOS.md` relate (pointer, merge, or precedence) — ties to the open "Constitution ↔ CLAUDE.md" question (RFC-000). | Single coherent entry; no bypass.   | Low–Med (governance-adjacent). | No (software) / Governance | **Yes**                   |
| **EP-M2** | Single shared `.aos/current/` + single-project assumption won't hold at 50 contributors / 5 products.                                                  | Area 10; AOS-VALIDATION-001 RC-D.                                      | Namespace `current/` per session/project **when** multi-runtime/multi-product becomes real (avoid premature build).                          | Concurrent scale without collision. | Low if deferred.               | No                         | **Yes**                   |

_(EP-M1 subsumes PK-000's EP-R1 and extends it to the "two manifests" concern.)_

---

## Final Decision

**B) Minor improvements recommended.**

**Evidence.** The manifest itself is well-constructed: 6 of 10 areas PASS, including the ones that
matter for _orientation_ — identity, entry routing, boot integration, current-state ownership,
knowledge navigation (load/don't-load), and simplicity. A pointed runtime becomes oriented from
`AOS.md` alone in under five minutes. This is **not** a redesign case (rules out **C**): the content
is sound, pointer-based, and portable; every gap is closed by _additive_ wiring, not restructuring.

It is also **not production-ready as-is** (rules out **A**), for one concrete, evidenced reason:
**discoverability FAILs (Area 7).** No runtime auto-finds `AOS.md` — `CLAUDE.md` is AOS-unaware and
the pointer is unapplied; other runtimes have no entry file. The recommended fixes are small and
additive (II-3 / EP-M1: per-runtime "read `AOS.md`" pointers), plus two minor simplifications
(II-1, II-2).

**Strict-interpretation caveat, surfaced honestly (do not let me bury it):** if the success bar is
read literally — _a completely new runtime becomes productive after reading **only** `AOS.md`, with
no human pointing and no per-runtime wiring_ — then Area 7's FAIL means the manifest **does not yet
meet that bar**, and a reviewer could justifiably escalate this to **C** _until the discovery
pointers are applied_. I judge **B** because the fix is one additive pointer per runtime (not a
redesign) and because AOS's own model assumes a human opens the session; but the evidence for the
stricter reading is real, and the Architect may overrule to C.

**Bottom line:** approve the manifest content; gate "production-ready" on wiring discovery
(II-3 / EP-M1) and applying the two minor simplifications.

---

_End of PROJECT_MANIFEST_REVIEW.md (PRJ-000). Reviewed the manifest only; modified nothing,
including `AOS.md`. Improvements are recommendations; architecture/governance items are Engineering
Proposals for decision — never applied. Awaiting Founder and Chief Architect review. Not continuing
automatically._
