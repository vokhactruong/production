# Active Decisions

> **Runtime version: slice-01.v8** — valid only with matching `manifest.md`.
> **Responsibility:** WHAT is already decided and binding for this task. Temporary state — loaded
> at Boot Step 5. These are given constraints; the AI respects them and does not re-derive or
> re-litigate them. Durable, organization-wide decisions live in the approved documents, not here.

## Binding decisions / constraints in effect (Founder, 2026-07-07)

### Architecture (from approved TECHNICAL_ANALYSIS.md — see its "Founder decision record")

- **Derived Balance is Source of Truth** — no stored counter; remaining = billingCycleSessions − COUNT(deducting attendance on COMPLETED sessions). Company-wide default for similar capabilities.
- **Model C with concept separation:** `AttendanceApplicationService` (evidence) → `LessonConsumptionService` (business rule). Same module, separated concepts; names reflect business, not database.
- **Dependency Inversion at completion:** ClassSession.complete() → Attendance Policy → Lesson Accounting. Completion must not know Attendance directly; analyze interface vs application service for the seam.
- **Bulk roster endpoint** `POST /attendance/sessions/:sessionId` approved (teacher <10s KPI).
- **No interactive transactions** on the completion path (pgbouncer constraint; derived balance removes the need).
- **`attendance.correct`** is a distinct permission for post-48h corrections (Admin/Manager). No role-name checks inside service code.
- **Business Invariant Tests** (official name) are mandatory; CI gains a `test` step. Framework choice: propose in the plan, flag for approval.
- **Read path must be aggregate, not N+1** (cross-review comment #1 — explicit task in the plan).
- **Rescheduled sessions:** rescheduling itself triggers nothing; a moved session that eventually COMPLETEs still deducts. CANCELLED never deducts.
- **E1 "finalized"** = any recorded status, including EXCUSED.

### Business rules (unchanged, from REQUIREMENT.md / BUSINESS_ANALYSIS.md)

- PRESENT/LATE/ABSENT deduct; EXCUSED does not — named policy value, per-organization configurable later, never scattered literals.
- Deduction consequence tied to Session → COMPLETED only; completion blocked until attendance finalized for all ACTIVE enrollments (service-layer invariant + test).
- 48h teacher correction window; corrections only, never deletes, always audited.
- Teachers get `attendance.read/create/update`.

### Mandatory Implementation Plan sections (Founder directive)

1. **Business Capability Mapping** (opener): Attendance realizes **Participation Management**; future reuse: HRM employee attendance, Booking check-in, CRM event attendance.
2. **Business Timeline** (diagram): Scheduled → Ongoing → Attendance Recording → Attendance Finalized → Session Completed → Lesson Consumed.
3. **Known Constraints** (recorded, not solved): Payment (Slice #2) must define remaining-lesson calculation for mid-cycle enrollment.

## Escalation answers received

- All 8 ⚑ decisions of the Technical Analysis: APPROVED with the adjustments above (Founder, 2026-07-07).

## Open escalations (blocking)

- _(none — the stage is unblocked)_
