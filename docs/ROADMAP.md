# ROADMAP.md

# Product Development Roadmap

## Current Stage

Build a stable SaaS MVP for small and medium education centers.

Priority:

Stability > Business Value > New Features

---

# Phase 1 - Foundation ✅

Goal:

Build the technical foundation.

Features

- Authentication
- RBAC
- User Management
- Dashboard
- School Settings
- Roles & Permissions
- Audit Logs
- File Upload
- Cloud Storage

Status: Completed / In Progress

---

# Phase 2 - Core Operations

Goal:

Replace Excel.

Features

- Student Management ✅
- Employee Management ✅
- Courses ✅
- Classroom ✅
- Class ✅
- Enrollment ✅
- Class Schedule (Planning Layer) ✅
- Class Session (Execution Layer, schedule-generated) ✅
- Attendance ✅
- Tuition
- Notifications

Next

Payment (Tuition)

Success

A center should be able to operate daily without spreadsheets.

---

## Scheduling Engine v1 (2026-07-05)

The Class Session module was refactored from manual session creation into a
Schedule-driven engine. See BUSINESS.md ("Scheduling Engine: Planning Layer vs
Execution Layer") and DATABASE.md (ClassSchedule / ClassSession) for the full
model.

Course → Class → **Class Schedule** → **Generate Sessions** → Class Session → Attendance → Payment → Invoice

Administrators no longer create Class Sessions directly. They define a
Class's weekly Class Schedule, then generate Sessions from it
(`POST /classes/:id/generate-sessions`) once the Class is OPEN, and later
append any missing future Sessions after a schedule change
(`POST /classes/:id/sync-sessions`). Manual editing of an individual Session
(date/status/topic/note) remains supported as an exception mechanism (holiday,
teacher request, reschedule) and never modifies the Class Schedule itself.

Deferred to a future phase (additive only, no refactor expected):

- Automatic rolling generation, holiday calendar, recurring exceptions
- Teacher/Classroom replacement per individual Session
- Bulk reschedule, notifications, calendar sync (Google/Outlook/Apple)
- QR / face / NFC attendance, offline sync, mobile teacher app

---

## Attendance v1 (2026-07-07)

Attendance / Participation Management capability — evidence-based, derived
balance. Attendance is recorded per (Enrollment × ClassSession) as
participation evidence (bulk, idempotent `POST /attendance/sessions/:sessionId`),
and completing a Session is blocked until every ACTIVE enrollment is marked
(EXCUSED counts as finalized). Lesson consumption is derived, never stored:
remaining = billingCycleSessions − COUNT(deducting attendance on COMPLETED
sessions) — no counter columns, nothing runs at completion, corrections reverse
by construction. Teachers hold their first operational grant
(attendance.read/create/update); post-48h corrections require attendance.correct
(Admin-tier). See DATABASE.md (Attendance) and API.md (Attendance API) for the
full model.

Next: Payment (Tuition).

Known Constraint (recorded, deferred): how to calculate remaining lessons for
students who enroll mid-cycle belongs to Payment (Slice #2). A COMPLETED
session never accepts new attendance rows, so backfill cannot pre-empt that
decision.

---

# Phase 2.5 - Employee ↔ User Linking (Future Milestone)

Goal:

Allow employees to log in to the system using a linked User account.

Features

- Link an existing Employee to an existing User
- Create a new User account directly from the Employee detail page
- Unlink a User from an Employee
- Display linked account status on Employee profile

Rules

- Linking is optional. Employees continue to function without a User account.
- Employee business data is never duplicated into User.
- Login credentials and roles belong only to User.

Status: Planned

---

# Phase 3 - Business Management

Goal:

Help owners make business decisions.

Features

- Revenue Reports
- Financial Dashboard
- Student Statistics
- Teacher Performance
- CRM
- Trial Classes
- Enrollment Pipeline

Success

Owners can manage the business from the dashboard.

---

# Phase 3.9 - Guardian Data Model (Foundational Epic)

Goal:

Model Guardian as a first-class entity instead of flattened fields on Student, so the Parent Portal (Phase 4) can attach a User account to it the same way Employee already attaches to User.

Why now

The Phase 1 Identity & Authorization database audit (2026-07-02) found that `Student.guardianName` / `guardianPhone` / `guardianEmail` are plain string columns with no `Guardian` table and no `Student ↔ Guardian` relation. This duplicates guardian data across siblings (no single source of truth, no dedupe, drift risk) and blocks the Guardian ↔ User linking pattern the PRD requires for Parent Portal.

Features

- `Guardian` model: business profile (firstName, lastName, phone, email), optional 1-1 `userId` link to `User` — same pattern as Employee ↔ User.
- `StudentGuardian` junction table: `studentId`, `guardianId`, `relationship`, `isPrimary` — many-to-many (siblings share guardians; a student may have more than one guardian).
- Backfill migration: dedupe existing `Student.guardianName/Phone/Email` values into `Guardian` rows before those columns are deprecated/dropped.

Rules

- Must be completed and stable before Guardian Portal / Parent Portal (Phase 4) implementation starts.
- Do not duplicate guardian contact info back onto Student once this lands.

Status: Planned

---

# Phase 4 - Parent Experience

Goal:

Improve customer experience.

Features

- Parent Portal
- Student Portal
- Homework
- Learning Progress
- Teacher Comments
- Parent Notifications

Success

Parents can follow their children's learning without contacting the center.

---

# Phase 5 - Automation

Goal:

Reduce repetitive work.

Features

- Automatic Tuition Reminder
- QR Attendance
- Automatic Makeup Classes
- Online Payments
- Payroll Support

Success

Daily administrative work is mostly automated.

---

# Phase 6 - AI

Goal:

Differentiate from competitors.

Features

- AI Student Comments
- AI Progress Summary
- AI Chatbot
- AI Enrollment Assistant
- AI Risk Prediction

Success

AI reduces manual work while improving customer satisfaction.

---

# Phase 7 - Enterprise

Goal:

Scale the platform.

Features

- Multi-tenancy
- Subscription Billing
- Mobile Apps
- Public API
- Integrations
- White-label
- Analytics

Success

Support hundreds of education centers from one platform.

Known architecture debt (recorded 2026-07-02, not yet implemented)

The Phase 1 Identity & Authorization database audit found that no identity model (`User`, `Role`, `Permission`, `Employee`, `Student`, ...) carries an `organizationId`/`centerId`, and several uniqueness constraints (`User.email`, `Role.name`, `Permission.name`/`code`) are scoped globally rather than per tenant. Introducing multi-tenancy will require re-scoping these to composite unique constraints (`@@unique([organizationId, email])`) across every identity table at once, plus updating every uniqueness check in the auth/employees/roles services in lockstep — budget Phase 7 planning for a breaking migration, not an incremental one.

---

# Development Rules

Always prioritize:

1. Business Value
2. Customer Feedback
3. Simplicity
4. Stability
5. Scalability

Never build future features before the current phase is stable.
