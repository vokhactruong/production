# RFC-001 — AI Company Operating Architecture (v1)

> **Status: DRAFT — operating configuration in effect by Founder decision (2026-07-07);
> formal ratification at the Slice #1 Reflection Meeting, re-confirmed after Slice #2
> ("No abstraction without repeated evidence" — n=1 today).**
> Supersedes the tool-to-role mapping assumptions in ORGANIZATION_STRUCTURE.md §5 once ratified.
> Drafted by: AI Co-Architect, from Founder decisions. Decides nothing not already decided.

## Evidence (why this RFC exists)

Slice #1 produced the company's first organization-level evidence:

1. Claude Desktop + spawned workers executed Phases 1–7 with zero contract violations — but
   **could not verify at write time** (no toolchain in the worker sandbox: no pnpm, no DB,
   45s shell cap). "Verify-at-write is non-negotiable for money-adjacent code."
2. Claude CLI's repo-grounded drafting (Sprint 0–2, Technical Analysis 9.8/10) was the
   highest-rated artifact of the slice — evidence citations only a runtime inside the repo makes.
3. Claude Extension was never needed on the critical path.
4. Cross-review caught two real defects (Prisma-upsert mechanism, D4 COMPLETED-create edge) —
   review value is proven, and is highest when the reviewer did not produce the artifact.

## The four stages and their owners

| Stage                     | Owner                                                     | Scope                                                                                                                                                                                      |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1 · Product Discovery** | **Claude Desktop** — _Product & Architecture Coordinator_ | Customer Journey, Requirement, Business Analysis, runtime state (`.aos/current/`), handoff preparation, coordination                                                                       |
| **2 · Execution**         | **Claude CLI** — _Delivery Manager_                       | **Drafting Technical Analysis + Implementation Plan** (amendment A2), Implementation, migration, build, type-check, Business Invariant Tests, verification-at-write, grouped commits, ship |
| **3 · Review**            | **Claude Desktop** — _Product & Architecture Coordinator_ | Cross-review of everything it did not produce, Implementation-Contract check, gate check (incl. file-integrity standing guard), Reflection + Lesson drafts, daily automated audit          |
| **4 · Architecture**      | **ChatGPT** — _Chief Architect & Organization Designer_   | Architecture/pattern/RFC **recommendations**, organization design, capability evolution, long-term direction                                                                               |

**Claude Extension:** off the critical path. Optional tool for quick refactors, one-file fixes,
pair programming with the Founder. Not an organizational link.

**Spawned workers (Claude Desktop subagents):** fallback execution capacity for
non-toolchain work (documents, analysis, config drafting) or when the CLI is unavailable —
always under Stage-3 supervision, never the responsible owner of Implementation.

## Amendments to the Founder's proposal (approved intent, corrected wording)

- **A1 — Authority.** No AI owns a _decision_. Stage 4 owns the **recommendation**; a decision
  exists only when the Founder relays/signs it. This preserves the ratified authority model
  (Operating Model §2: business and architecture authority is human). In practice: Founder +
  Chief Architect sign Execution Authorization; Founder signs everything reserved to business.
- **A2 — The executor owns its plan.** Technical Analysis and Implementation Plan are drafted in
  Stage 2 (CLI), reviewed in Stage 3 (Desktop), decided by Founder (+Stage 4 recommendation).
  Rationale: accountability (the runtime that ships the code owns the plan it ships) and review
  independence (the reviewer never reviews its own draft) — both evidenced in Slice #1.
- **A3 — Two explicit loops.**
  _Escalation:_ Stage 2 hits a contract/scope problem → stop task → Stage 3 (Desktop) triages →
  only genuine decisions reach the Founder.
  _Findings:_ Stage 3 findings return to Stage 2 to fix — the reviewer never fixes its own
  findings.
- **A4 — Evidence discipline.** This architecture runs as the operating configuration now, but is
  a **Pattern Candidate at organization level**: ratified at the Reflection Meeting, re-confirmed
  after Slice #2. If Slice #2 contradicts it, the evidence wins, not the document.

## A5 — Runtime Contract (Founder addition, 2026-07-07)

`.aos/current/` is governed by a **Runtime Contract** (`.aos/current/manifest.md`):

- Every runtime **verifies the manifest before acting**: all five state files declare the same
  Runtime version; every source artifact still carries the status the manifest records; the
  manifest's stage matches `task.md`. Any mismatch → do not run, report, ask.
- **Evidence:** during Slice #1 a manual handoff updated role/task/plan but left `context.md`
  one stage stale — exactly the half-updated-state failure the version check prevents.
- **Derived-runtime discipline:** `.aos/current` content must trace to approved artifacts —
  no free-form authorship. It is a _projection of approved evidence_ (the same architecture as
  Derived Balance: state derived from evidence, never an independent source of truth).
- **Deferred (Pattern Candidate, build after Slice #2):** a generator script that produces
  `.aos/current` from approved artifacts automatically. Not built now — n=1, the artifact shapes
  are still settling, and a generator without version discipline would still emit stale state;
  the version check is the actual staleness fix. Amending `.aos/boot.md` to formalize the boot
  check goes through RFC ratification at the Reflection Meeting (boot loader is frozen).

## Non-goals

- No change to the Playbook lifecycle stages or gates (Execution Authorization, Scope Gate,
  supervision gates remain as recorded in Slice #1 artifacts).
- No change to human authority; no new AI roles; no framework unfreeze.

_End of RFC-001 (DRAFT). Next review: Slice #1 Reflection Meeting._
