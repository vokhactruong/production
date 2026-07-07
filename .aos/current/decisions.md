# Active Decisions

> **Responsibility:** WHAT is already decided and binding for this task. Temporary state — loaded
> at Boot Step 5. These are given constraints; the AI respects them and does not re-derive or
> re-litigate them. Durable, organization-wide decisions live in the approved documents, not here.

## Binding decisions / constraints in effect (Founder, 2026-07-07)

- **Deduction policy:** PRESENT/LATE/ABSENT deduct; EXCUSED does not. Default Organization Policy — design must allow per-organization configuration later; do not hardcode as the only behavior.
- **Deduction trigger:** Session → COMPLETED business event. Never at attendance marking. Cancelled/rescheduled sessions never deduct.
- **Completion invariant:** a ClassSession cannot transition to COMPLETED until attendance is finalized for all ACTIVE enrollments. Service-layer invariant with test coverage, not a UI rule. UX: "Mark All Present" shortcut.
- **Correction window:** 48h teacher-editable; then Admin/Manager only. Corrections only, never deletes, always audited.
- **Teacher permissions:** teachers receive attendance read/create/update in this slice.
- **EXCUSED:** business status only; no approval workflow this slice.
- **Attendance is Evidence, not State** — consumed by Payment/Analytics/Notification/Prediction/AI.
- **Trade-off mandate:** analyze Models A (direct CRUD) / B (event-driven) / C (business service) for deduction. No default. Criterion: simplest design that keeps deduction replaceable ("Simple before clever"; "No abstraction without repeated evidence").
- **Business rules are upstream of technical options:** no technical choice may alter an approved business rule.
- **Invariant tests are in the DoD** — not optional; CI gains a `test` step.
- **Out of scope:** notifications, QR/mobile, makeup/leave flow, AI capabilities, analytics dashboard, teacher attendance/payroll.

## Escalation answers received

- E1 → Option A: completion blocked until attendance finalized (Founder). E2 → EXCUSED needs no approval flow (Founder). Both recorded in BUSINESS_ANALYSIS.md.

## Open escalations (blocking)

- _(none — the stage is unblocked)_
