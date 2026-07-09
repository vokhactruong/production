# Lesson — Product Slice #1: Attendance

> Per `playbook/templates/lesson-template.md`. This is the ONLY place organization changes
> originate — as proposals, never direct edits.

- **Feature:** Attendance (Product Slice #1 — Participation Management capability)
- **Date:** 2026-07-08
- **Author:** AI Co-Architect (Stage 3), from the full slice record

## What happened

The company's first full lifecycle run: Customer Journey → Requirement → Business Analysis →
Technical Analysis → Implementation Plan → Execution Authorization → Implementation (Phases 1–7
by supervised Desktop workers) → Phase 8 verification by Claude CLI → Review. Outcome: attendance
recording + derived lesson balance + history, 6 invariant test suites green on first run, zero
in-contract defects, 7 grouped commits pushed.

Harder than expected: toolchain access (workers had none — Phase 8 existed because of it), a git
corruption incident (host file-lock truncated 24 working files; committed objects intact), and a
half-updated `.aos/current` handoff (context.md left one stage stale).

## What we learned (evidence-based)

1. **Verify-at-write is non-negotiable for money-adjacent code.** Workers wrote 7 phases blind;
   everything passed later, but only Phase 8 proved it. → drove RFC-001's Stage-2/Stage-3 split.
2. **Cross-review catches real defects, not opinions.** Two production bugs prevented on paper:
   the Prisma-upsert-vs-partial-index mechanism and the COMPLETED-create mid-cycle leak (D4).
3. **Derived state beats stored state where evidence exists.** Derived Balance made two DoD
   invariants true by construction and neutralized a documented pgbouncer transaction hazard.
4. **Runtime state needs a contract.** The stale-context incident → manifest.md version check
   (Runtime Contract, RFC-001 A5).
5. **Commit is not backup.** The corruption incident was survivable only because work was
   committed; push-to-origin belongs in every execution run order.
6. **Slice Success Metrics (Product KPIs):** teacher <10s — enabler code-verified, live
   measurement pending (release gate); balance correctness — invariant-tested; real-time
   visibility — shipped (history + roster views); parent-dispute and payment-accuracy metrics
   measurable only after Slices #2/#3.

## The Reflection question

> "Did we learn something that should improve **every future project**?"

- **Answer:** ☑ Yes

---

## Future RFC Proposals (recorded — awaiting Architect review at the Reflection Meeting)

**P1 — Ratify RFC-001 (4-stage operating architecture + A5 Runtime Contract).**
Evidence: this entire slice. Layer: AOS/Organization. Risk if not: role drift by convenience.

**P2 — Lifecycle gains "Execution Authorization" as an explicit stage** (already practiced;
formalize in playbook/feature-lifecycle.md from Slice #2). Layer: Playbook.

**P3 — Customer Journey precedes Requirement** (practiced once; adopt as template section after
Slice #2 confirms — Rule of Three). Layer: Playbook.

**P4 — Capability model** (Journey → Business Capability → Product Slice → Engineering Slice;
Participation Management is capability #1, reuse targets HRM/Booking/CRM). Layer: AOS. After
Slice #2/#3 evidence.

**P5 — "No abstraction without repeated evidence"** as a named company principle. Layer: AOS
principles. Evidence: correctly deferred the event-driven Model B, the runtime generator, and
premature framework work — all without losing the ideas.

**P6 — Boot loader adds the Runtime Contract check** (verify manifest before READY). Layer:
Playbook/boot (frozen — needs RFC). Evidence: stale-context incident.

**P7 — Known Constraints handoff:** Payment (Slice #2) inherits: mid-cycle enrollment
remaining-lesson calculation; per-organization deduction policy configuration; PII retention
model before Parent Portal. (Not an org change — a scope obligation for the next slice.)

**P8 — One Capability → One Owner → One Runtime (Founder addition at the Reflection Meeting,
2026-07-08).** Evidence: implementation split across two runtimes (workers Phases 1–7, CLI
Phase 8) created the verify-at-write gap that Phase 8 existed to close. From Slice #2, the
Delivery Manager owns implementation end-to-end. Precision boundary (Co-Architect): this applies
to **Implementation** — design and review stages remain deliberately multi-runtime per RFC-001.

> The Architect decides whether these become RFCs. Recorded, not applied.

---

## Reflection Meeting decisions (2026-07-08) — disposition of the proposals

Slice #1 status: **SHIPPED THROUGH AOS**. P1 → RFC-001 PROVISIONALLY RATIFIED. P2 → lifecycle
stage, effective now. P3, P4 → Pattern Candidates, await Slice #2 (Rule of Three). P5 → Company
Principle, effective now. P6 → active draft, boot untouched until Slice #2. P7 → Known
Constraints inherited by Slice #2. P8 → adopted (see above). Doc drift (3 items) → approved,
fixed. Learning chain refined: Review → Evidence → Lesson → Pattern Candidate → RFC (A9).
Open (non-blocking): GitHub Actions confirmation; teacher ≤10s live KPI.
