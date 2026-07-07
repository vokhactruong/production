# Requirement — Product Slice #1: Attendance

> **Status: APPROVED — Founder, 2026-07-07.** Open questions resolved by Founder decisions (see
> "Founder decisions" section). Storage convention `docs/slices/` ratified by Founder.
> Drafted by AI Co-Architect per `playbook/templates/requirement-template.md`.
> Includes a Customer Journey section (Founder decision, 2026-07-07) preceding the Problem —
> recorded as a Pattern Candidate, not yet a Playbook change.

- **Feature:** Attendance (Product Slice #1)
- **Date:** 2026-07-07
- **Requested by:** Founder

---

## Customer Journey (before Requirement — Founder decision)

**Teacher** — walks into class with 15 students. Today: opens paper/Excel, marks names, retypes
into a sheet later, makes mistakes, forgets. Desired: opens today's session on any device, sees
the enrolled roster, taps each student's status, done in under 10 seconds per class.

**Center admin / Receptionist** — today has no real-time view of who is absent; finds out days
later when a parent calls. Desired: sees today's attendance across all sessions live; spots
absences immediately.

**Parent** — today hears nothing unless they call. Desired (future slice): is notified when their
child is absent. _Out of scope for Slice #1 — requires Notification capability._

**Student** — today may lose paid lessons to recording errors. Desired: remaining lessons are
deducted accurately and automatically from actual attendance.

**Owner** — today cannot answer "how full are my classes actually?" Desired (future slice):
attendance analytics. _Out of scope for Slice #1._

**Pain → Requirement:** the teacher's manual recording and the center's blind spot are the pains
this slice removes. Everything else consumes the data this slice creates.

---

## Problem

Attendance is recorded manually (paper → Excel), is error-prone, arrives late, and lesson
deduction is counted by hand. This is Business Problem #2 (⭐⭐⭐⭐⭐, BUSINESS.md) and the
prerequisite for Tuition/Payment (Slice #2), which consumes attendance data.

## Who benefits

Teachers (fast recording), receptionists/admins (live view, corrections), students/parents
(accurate lesson balance), owner (trustworthy data feeding Payment).

## Business value

- **Save time:** attendance in < 10 seconds per class (BUSINESS.md success metric).
- **Reduce mistakes:** no retyping; deduction is computed, not counted.
- **Increase revenue (indirect):** Payment (Slice #2) cannot be correct without trustworthy attendance.

## Desired outcome

A teacher or admin records attendance for any COMPLETED-or-today ClassSession against the
enrolled students; each PRESENT/LATE record deducts exactly one lesson from the student's
enrollment balance exactly once; history is viewable per class, per session, and per student.

## Slice Success Metrics (Product KPIs — Founder addition, 2026-07-07)

| Stakeholder     | Metric                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| Teacher         | Attendance recorded in < 10 seconds per class                                               |
| Reception/Admin | Real-time attendance visibility across today's sessions                                     |
| Student         | Remaining-lesson balance is always correct                                                  |
| Parent          | Zero manual attendance disputes _(directional — measurable once parent-facing slices ship)_ |
| Owner           | Payment accuracy increases (measured at Slice #2)                                           |

These are Product KPIs of the slice, not engineering metrics. Reflection at slice close must
assess them.

## Definition of Done

- [ ] Attendance can be recorded per (Enrollment × ClassSession) with status; roster comes from ACTIVE enrollments of the session's class.
- [ ] Recording is idempotent: re-submitting a session's attendance updates, never duplicates.
- [ ] Lesson deduction is triggered by the Session → COMPLETED business event (not by attendance marking), applies exactly once per deducting status, and is reversed if a record is corrected to a non-deducting status (Founder decision Q3).
- [ ] Attendance is stored on its own table referencing Enrollment + ClassSession — never on ClassSession (BUSINESS.md participation-layer rule).
- [ ] Inactive students cannot receive attendance (PRD business rule).
- [ ] RBAC: new permission codes seeded and enforced (teacher-facing permissions escalated to Founder — see Open questions).
- [ ] **Invariant tests exist and pass** (Founder decision, 2026-07-07):
  - [ ] One attendance record per (enrollmentId, sessionId) — cannot be created twice.
  - [ ] No double lesson deduction under retry/race.
  - [ ] Soft delete does not break the uniqueness rule (partial-unique convention).
  - [ ] sessionNumber never reused (regression guard on the invariant this slice consumes).
  - [ ] Enrollment race guard holds (one ACTIVE enrollment per student per class).
  - [ ] **Completion precondition (Founder invariant, E1):** a ClassSession cannot transition to COMPLETED until attendance has been finalized for all ACTIVE enrollments — enforced in the service layer and covered by a test, not only in UI.
- [ ] Build, lint, type-check pass; CI gains a `test` step that runs the invariant tests.
- [ ] Docs updated (DATABASE.md, API.md; ROADMAP.md Phase 2 status) before Done.

## In scope

- Attendance data model + migration (status set: see Open questions).
- API: record/update attendance for a session; query by session, class, student.
- Admin UI: session attendance screen (roster + statuses, **"Mark All Present" shortcut** — approved UX for the completion precondition), attendance history views.
- Automatic lesson deduction on Enrollment.
- Audit log on attendance writes (critical business action).
- Invariant tests listed above.

## Out of scope (deliberately)

- Parent notifications (Slice #3 — Communication).
- QR / mobile / face attendance (ROADMAP deferred list).
- Makeup classes / leave requests (separate feature; interaction recorded as open question).
- Teacher attendance / payroll (Teacher Management, later phase).
- AI capabilities (reminder, insight, prediction) — added as capability once attendance data exists (Founder decision: AI is a capability, not a feature).
- Attendance analytics dashboard (Slice #4 — Analytics).

## Constraints

- Must follow existing conventions: soft delete, partial-unique + `deletedAt: null` lookups, transaction + audit-log pairing, response envelope, feature-based frontend with query-key factory.
- Schema change requires Architect approval before Implementation (escalation rule).
- Money is untouched in this slice; deduction affects lesson counts only.
- Slice #1 also validates ACP/KES/runtime: `.aos/current/*` must be populated for this task, and Reflection + Lesson are mandatory at close.

## Priority

Highest. ROADMAP Phase 2 names it as next ("Attendance → Payment"). It unblocks the revenue slice and is the first validation of the whole operating system.

## Founder decisions (2026-07-07 — all former open questions resolved)

- **Q1 — Status set & deduction:** PRESENT ✅ deducts · LATE ✅ deducts · ABSENT ✅ deducts · EXCUSED ❌ does not deduct. Rationale: the center reserves the seat and teacher; unexcused absence still consumes the lesson; excused absence is preserved/made up (future slice). This is the **default Organization Policy** — must be configurable per organization later, not hardcoded as the only behavior.
- **Q2 — Who records:** Teachers get `attendance.read` + `attendance.create/update` permissions in this slice. Direct teacher operation is the core value; admin marking on behalf is not the model.
- **Q3 — Deduction trigger:** deduction applies when the **Session becomes COMPLETED**, not at attendance marking. Session Completed is the business event; attendance marking is data entry. A cancelled/rescheduled session must never deduct.
- **Q4 — Correction window:** attendance is editable for **48 hours**; after that only Admin/Manager may correct. Never delete — corrections only, always audited.
- **Q5 — ABSENT and balance:** ABSENT deducts; EXCUSED does not (subsumed by Q1). Default policy now; per-organization config later.

## Architecture trade-off flagged for Technical Analysis (Founder directive)

Founder framing: **Attendance is Evidence, not State.** Deduction is a consequence consumed by
downstream capabilities (Payment, Analytics, Notification, Prediction, AI), not a property of
the attendance record.

**Claude CLI must analyze exactly three models in TECHNICAL_ANALYSIS.md — no default assumed:**

- **Model A:** Attendance → updates Enrollment directly (CRUD).
- **Model B:** Attendance → Attendance Event → Enrollment (event-driven).
- **Model C:** Attendance → Business Service → Enrollment (explicit service layer owns deduction).

Evaluate per "Simple before clever": the simplest design that keeps deduction logic replaceable
when Makeup/Holiday/Voucher/Credit arrive. Not a rule engine by default; not CRUD by default.

**Binding constraint on the analysis (Founder, 2026-07-07):** every technical option starts from
the approved Business Rules and is evaluated against them. A technical solution must never
change the business rules.

## Open questions

- ~~Unmarked students at session completion~~ → **RESOLVED (Founder, E1):** Option A — session
  completion is blocked until attendance is finalized. See Business Rule invariant in the DoD.
- _(none remaining)_
