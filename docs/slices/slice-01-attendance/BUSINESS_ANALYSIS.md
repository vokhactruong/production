# Business Analysis — Product Slice #1: Attendance

> **Status: APPROVED — GO. Founder, 2026-07-07.** E1 and E2 resolved (see Escalations).
> Per `playbook/templates/business-analysis-template.md`. Owner: Founder (AI Co-Architect drafts).

- **Feature:** Attendance (Product Slice #1)
- **Linked requirement:** `docs/slices/slice-01-attendance/REQUIREMENT.md` (APPROVED 2026-07-07)
- **Analyst:** AI Co-Architect

## Value test

- [x] **What problem does this solve?** → Manual attendance (paper → Excel) and hand-counted lesson deduction — Business Problem #2, ⭐⭐⭐⭐⭐ (BUSINESS.md).
- [x] **Who benefits?** → Teachers (record in <10s), reception (live visibility), students/parents (correct balances), owner (trustworthy data for Payment).
- [x] **Does it reduce manual work?** → Yes — eliminates re-typing and manual lesson counting; success metric targets ≥50% admin-work reduction (BUSINESS.md).
- [x] **Does it increase revenue (or protect it)?** → Protects it directly: lesson deduction is the metering unit of tuition. Wrong attendance = wrong Payment (Slice #2). Attendance is the revenue sensor of the product.
- [x] **Does it improve customer/parent satisfaction?** → Indirectly now (accurate balances → fewer disputes); directly at Slice #3 when notifications consume this data.
- [x] **Can it be simpler?** → It already is the minimal vertical slice: record + deduct + history. QR/mobile/AI/notifications/analytics all deferred. The only further simplification — dropping automatic deduction — would defeat the business purpose.

**Verdict: passes the value test on all five value dimensions.**

## Business rules affected

**New rules introduced (from Founder decisions, 2026-07-07):**

- Deduction policy: PRESENT/LATE/ABSENT deduct; EXCUSED does not — default Organization Policy, configurable per organization later, not hardcoded (Q1/Q5).
- Deduction fires on Session → COMPLETED, never on marking, never for cancelled/rescheduled sessions (Q3).
- 48-hour correction window; afterwards Admin/Manager only; corrections are audited, never deleted (Q4).
- Teachers hold attendance permissions and operate directly (Q2).

**Existing rules touched (cited):**

- "Attendance deducts remaining lessons" (PRD Business Rules) — this slice implements it.
- "Inactive students cannot attend classes" (PRD) — enforced at recording.
- Participation layer separation: attendance references Enrollment + ClassSession, never stored on ClassSession (BUSINESS.md, Scheduling Engine section).
- sessionNumber permanence and one-ACTIVE-enrollment rules (DATABASE.md) — consumed, not changed.
- Soft delete + audit on critical actions (CLAUDE.md/CONVENTIONS) — attendance writes are critical business actions.

**Rule change required in docs:** none. This slice adds rules; it contradicts nothing existing.

## Stakeholders & impact

| Stakeholder        | Impact                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teacher            | New daily workflow (the slice's primary user). First time the Teacher role gets operational permissions — a role-scope expansion of the RBAC seed. |
| Receptionist/Admin | Live monitoring; correction authority after 48h window.                                                                                            |
| Student            | Balance becomes system-computed instead of hand-counted.                                                                                           |
| Parent             | No direct interaction yet; data foundation for Slice #3 notifications.                                                                             |
| Owner              | First trustworthy operational dataset; predicate for revenue reporting.                                                                            |
| Engineering/AI org | First full Playbook lifecycle run; validates ACP/KES/runtime with a real feature.                                                                  |

## Priority vs. roadmap

No queue-jumping: ROADMAP Phase 2 explicitly names "Next: Attendance → Payment". This slice is
the roadmap. It also unblocks the highest-priority business problem (Tuition, #1 ⭐⭐⭐⭐⭐),
which cannot be built correctly without attendance data.

## Business risks

**Of building:**

- **Deduction correctness is a money-adjacent risk.** A double deduction or missed reversal
  becomes a parent-facing billing dispute at Slice #2. Mitigated by the mandated invariant tests
  (Requirement DoD) — this is why they are non-negotiable.
- **Teacher adoption.** If recording takes >10s or fails on phones, teachers revert to paper and
  the data is worse than none (partial data feeding Payment). The <10s KPI is a launch gate, not
  a nice-to-have.
- **Policy variance across future customers.** Deduction policy differs between centers; Founder
  already ruled it must be an Organization Policy default, not hardcoded — keeps SaaS ambition intact.
- **Minors' PII grows.** Attendance is behavioral data about children. No documented
  retention/consent model exists yet (PROJECT_ANALYSIS §19) — acceptable for now, must be resolved
  before Parent Portal exposes this data externally.

**Of not building:** the product remains unable to fulfill its core value proposition; Payment
stays blocked; the entire AOS remains validated only by documents.

## Decision

- **Outcome:** ☑ Build ☐ Defer ☐ Drop
- **Approved by:** Founder, 2026-07-07
- **Rationale (Founder):** Attendance is not a feature — it is a **Revenue Enabler**. Payment cannot exist if Attendance is wrong. Correct business priority.

## Escalations / open questions — ALL RESOLVED (Founder, 2026-07-07)

- **E1 → RESOLVED: Option A.** New Business Rule (Founder-authored, binding invariant, not a UI
  rule): **"A ClassSession cannot transition to COMPLETED until attendance has been finalized."**
  Attendance is a _precondition_ of Session Completion, not the reverse. UX mitigation approved:
  teacher gets a "Mark All Present" shortcut, then corrects the absentees, then completes.
- **E2 → RESOLVED: no approval flow.** EXCUSED is a business status, not a workflow. Leave-request
  approval belongs to a future slice.
- **Founder framing to carry into Technical Analysis:** Attendance is **Evidence, not State** —
  a record of what happened, consumed by Payment, Analytics, Notification, Prediction, AI. It is
  not itself a business decision.

### Original escalation text (retained for the record)

- **E1 — Unmarked students at session completion (business decision, blocks Technical Analysis):**
  when a session becomes COMPLETED with enrolled students unmarked, choose one:
  1. **Block completion** until the roster is fully marked (strictest data quality; may frustrate teachers), or
  2. **Default unmarked → ABSENT** with audit note (fastest for teachers; risks silently deducting a student the teacher forgot), or
  3. **Leave unmarked = no deduction** (safest for students; leaks revenue and corrupts the "balance always correct" KPI).
     Co-Architect recommendation: **Option 1 for MVP** — it is the only option with no silent money
     effect, and the UI cost (a "mark all present" shortcut makes full marking a 2-tap action) is low.
- **E2 — Does EXCUSED require an approval flow now?** Recommendation: no — teacher/admin selects
  EXCUSED directly in this slice; leave-request + approval workflow belongs to the Makeup slice.
  Confirm so Technical Analysis can scope the status transitions.
