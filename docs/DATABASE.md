# DATABASE.md

# Database Standards

This document defines the database conventions for the Education Center Management SaaS.

Database design must prioritize:

- Simplicity
- Data Integrity
- Scalability
- Performance
- Maintainability

Never optimize prematurely.

---

# Database

Engine

PostgreSQL

ORM

Prisma ORM

All database access must go through Prisma.

Never write raw SQL unless absolutely necessary.

---

# Entity Relationship: User ↔ Employee

```
User (Authentication)
  id
  email
  password
  status
  roles
        |
        | 0..1  (optional)
        |
Employee (Business Profile)
  id
  userId?  ──── FK → users.id (nullable, unique)
  code
  firstName
  lastName
  employeeType
  status
```

Relationship: One-to-One, optional on both sides.

- A User may exist without an Employee (e.g., a system-only admin account).
- An Employee may exist without a User (e.g., staff not yet given system access).
- When linked, one User maps to exactly one Employee and vice versa.

Why the FK lives on Employee

The Employee table owns the relationship because the link is optional business configuration, not a core authentication requirement. Adding `userId` to Employee keeps the User table clean and focused on authentication only.

Why fields are never duplicated

Employee stores: firstName, lastName, email, phone, avatar, address, gender, dateOfBirth.

User stores: email (login identity), firstName, lastName (display name), avatar (profile photo).

Note: User.email is the login credential and may differ from Employee.email (work contact). They are separate fields for separate purposes and are never synchronized automatically.

Normalization

This design is in Third Normal Form (3NF). Each table has a single responsibility. No business data lives in User. No authentication data lives in Employee.

Future expansion

When Guardian and Student portals are implemented, the same pattern applies:

- Guardian profile ↔ User account (optional)
- Student profile ↔ User account (optional, for adult students)

---

# Scheduling Engine: ClassSchedule (Planning) → ClassSession (Execution)

```
Class
  startDate
  sessionCount
  status
        |
        | 1
        |
        N
ClassSchedule (Planning Layer)          ← source of truth for the recurring pattern
  id
  classId
  weekday        (0=Sunday..6=Saturday)
  startTime      (TIME)
  endTime        (TIME)
        |
        | read by SchedulingService.generateInitialSessions / syncMissingSessions
        ↓
ClassSession (Execution Layer)          ← generated business data, one row per actual session
  id
  classId
  sessionNumber  (permanent sequence, never reused, even across soft deletes)
  date
  status
  topic
  note
```

Relationship: `Class 1 ↔ N ClassSchedule` and `Class 1 ↔ N ClassSession`. `ClassSchedule` has no relationship to `ClassSession` directly — the link is one-directional and computation-only: the generation algorithm reads the Class's active `ClassSchedule` rows plus `Class.startDate` and `Class.sessionCount` to produce `ClassSession` rows. There is no FK from `ClassSession` back to `ClassSchedule`.

Why they are separate tables

`ClassSchedule` is a template ("this Class meets every Monday 18:00-20:00"). `ClassSession` is history ("this Class actually met on 2026-08-03"). Editing the template must never rewrite history: changing a weekly time slot does not retroactively change sessions that were already generated, and manually rescheduling one session (holiday, teacher request, power outage) must never write back to the template. Keeping them as separate models is what makes both directions safe.

Why sessionNumber is a full unique constraint, not partial

Unlike most soft-deletable business codes in this schema (Classroom.code, Class.code), `ClassSession.sessionNumber` is scoped with a full `@@unique([classId, sessionNumber])`, not a partial index excluding soft-deleted rows. A session number is a permanent business identifier ("Session 8"), not just a uniqueness key — reusing it after a delete would let two different physical sessions share the same label over time, which is unrecoverably confusing once Attendance, Payment, and Reports start referencing "Session 8". `findMaxSessionNumber` therefore intentionally includes soft-deleted rows when computing the next number.

Why ClassSchedule's uniqueness is partial (the opposite choice)

A `ClassSchedule` slot is not a business identifier — it's just the current set of active weekly meeting times. Deleting a slot and adding a new one at the same `(weekday, startTime)` is a normal edit, not a historical record, so its uniqueness is scoped to `WHERE "deletedAt" IS NULL` and a freed slot can be reused immediately.

What ClassSession must never store

Per Attendance/Payment compatibility: `ClassSession` never stores student data (Attendance owns participation, referencing `Enrollment + ClassSession`) and never stores financial data (Payment consumes `Attendance + Enrollment + ClassSession`). Teacher and Classroom are always derived from `Class.employeeId` / `Class.classroomId` — never duplicated onto the session — so a future "Teacher/Classroom Replacement per Session" feature can extend `ClassSession` additively without a redesign.

---

# Attendance: Participation Evidence (Enrollment × ClassSession)

```
Enrollment                                ClassSession
  billingCycleSessions                      status (PLANNED/ONGOING/COMPLETED/CANCELLED)
        |                                         |
        | 1                                       | 1
        |                                         |
        N                                         N
Attendance (Evidence Layer)               ← one live row per (Enrollment × ClassSession)
  id
  enrollmentId    ──── FK → enrollments.id
  classSessionId  ──── FK → class_sessions.id
  status          (AttendanceStatus: PRESENT | LATE | ABSENT | EXCUSED)
  note?
  markedById?     ──── FK → users.id (nullable, ON DELETE RESTRICT)
  deletedAt / createdAt / updatedAt
```

Indexes: `enrollmentId`, `classSessionId`, `status`, `deletedAt`, plus the partial unique index below. All FKs are `ON DELETE RESTRICT`.

Why uniqueness is a partial index in raw SQL

"One Attendance record per (Enrollment × ClassSession)" is enforced by `attendances_active_enrollment_session_key`, a unique index on `(enrollmentId, classSessionId) WHERE "deletedAt" IS NULL` written in raw migration SQL (migration `20260709000000_add_attendance`, same convention as `enrollments_active_student_class_key`). A soft-deleted row's key can be reused; two live rows can never coexist. Prisma's DSL cannot express partial indexes, so the model has no `@@unique` — which means `prisma.attendance.upsert()` cannot target this key. Writers must use `findFirst({ deletedAt: null }) → create/update` and treat `P2002` as "a concurrent create won the race" (re-read + update). The index is the race-condition backstop; idempotent bulk recording relies on it, not on transactions.

Derived Balance rule (no counter columns)

remaining = `Enrollment.billingCycleSessions − COUNT(non-deleted Attendance rows with a deducting status whose ClassSession.status = COMPLETED)`

Derived Balance is Source of Truth — the company-wide default architecture (Founder decision). No stored lesson counter exists anywhere: no column on Enrollment, no write at session completion. The session _being_ COMPLETED is what makes its deducting rows count, so corrections reverse by construction and CANCELLED sessions never consume. The deduction policy (`DEDUCTING_STATUSES`: PRESENT, LATE, ABSENT — EXCUSED does not deduct) is a single named value owned by `LessonConsumptionService`, and balances are always computed with one grouped COUNT per request — never a COUNT per row.

What Attendance must never store

Attendance is consequence-free evidence and never stores derivable data: no teacher, no classroom, no student columns. Student and class are reached through the `enrollment` relation; session facts through `classSession`. There is no delete path — corrections only, always audited.

---

# Money: Financial Evidence (Ledger) → Derived Money (BillingCycle × LedgerEntry)

This is the money-side proof that _Evidence → Derived Balance_ generalizes: _Financial Evidence (an append-only ledger) → Derived Money_. Nothing is a stored money counter — outstanding, revenue and credit are all queries.

```
Enrollment                                   Student
    | 1                                          | 1
    | N                                          | N
BillingCycle (snapshot artifact)             LedgerEntry (append-only Financial Evidence)
  id                                           id
  enrollmentId  ── FK → enrollments.id         type   (CHARGE|PAYMENT|CREDIT_GRANT|CREDIT_OFFSET|REFUND)
  status        (PENDING|ACTIVE|               amount (Decimal, UNSIGNED — P1)
                 COMPLETED|CANCELLED)          studentId       ── FK → students.id
  snapshotPrice    (Decimal, frozen at sale)   billingCycleId? ── FK → billing_cycles.id (RESTRICT)
  snapshotDiscount?(Decimal)                   method?         (CASH|BANK_TRANSFER — PAYMENT only)
  sessionsSold  (Int, the cap this cycle       receiptNumber?  (Int @unique — from receipt_number_seq, PAYMENT only, D17)
                 grants)                        creditSource?   (OVERPAYMENT|WITHDRAWAL — CREDIT_GRANT only, BI-9)
  note? / audit / soft-delete                  refundStatus?   (NOT_REFUNDED|REFUNDED — CREDIT_GRANT only)
                                               note? / createdById? / soft-delete
```

Indexes: BillingCycle — `enrollmentId`, `status`, `deletedAt`; LedgerEntry — `type`, `studentId`, `billingCycleId`, `deletedAt`. All FKs are `ON DELETE RESTRICT` (recorded money evidence is never cascade-deleted).

Why uniqueness is partial indexes in raw SQL

Three business rules are **database-enforced**, not application-only — each a partial unique index in raw migration SQL (Prisma's DSL cannot express partial indexes, so there is no `@@unique`; writers `create` and treat `P2002` as "a concurrent writer won"):

- `billing_cycle_one_active_key` on `(enrollmentId) WHERE status = 'ACTIVE' AND "deletedAt" IS NULL` — at most one ACTIVE cycle per enrollment (the `enrollments_active_student_class_key` convention, verbatim).
- `billing_cycle_one_pending_key` on `(enrollmentId) WHERE status = 'PENDING' AND "deletedAt" IS NULL` (F1) — at most one PENDING successor, however many times lazy renewal fires. BI-4's "exactly one" rests on this index, not on an app guard.
- `ledger_one_charge_per_cycle_key` on `(billingCycleId) WHERE type = 'CHARGE' AND "deletedAt" IS NULL` (R1/BI-12) — at most one CHARGE per cycle, which makes healing a chargeless orphan idempotent under retry/concurrency: a duplicate CHARGE insert raises `P2002` and is swallowed as a no-op.

The receipt number is a global Postgres **SEQUENCE** `receipt_number_seq` (`nextval` in a single statement) — never reused, gaps acceptable; formatted `RC-000001`.

Derived Money rule (no counter columns)

Amounts are stored **UNSIGNED** (P1); the sign algebra lives in exactly one place, `DerivedMoneyService`:

```
outstanding(cycle)     = Σ CHARGE − Σ PAYMENT − Σ CREDIT_OFFSET      (per cycle)
revenue                = Σ PAYMENT                                    (never any credit type — BI-10)
creditBalance(student) = Σ CREDIT_GRANT − Σ CREDIT_OFFSET − Σ REFUND  (per student)
```

These are the BI-11 conservation equations, so value is never created or destroyed. **Revenue and liability are strictly separate views (BI-10)** — credit is never counted as revenue. Every figure is a grouped SUM (aggregate, never N+1). Cross-cycle attribution is **capacity-based FIFO (P4)**: cycles ordered by creation, each absorbs consumption up to its `sessionsSold` cap — a pure function of current evidence, so a 48h retroactive attendance correction never rots a stored boundary (nothing is stored). `LessonConsumptionService` stays the single source of the consumed total.

Time-frozen Business Artifact (D17) and price freeze (D14)

The Receipt is a **Time-frozen Business Artifact** — the deliberate, justified exception to "never store derivable data" (not a precedent for casual denormalization): its receipt number and the PAYMENT row's `studentId` + `billingCycleId` are frozen on the append-only row. The BillingCycle's `snapshotPrice`/`snapshotDiscount` are frozen at sale and hard-frozen once a receipt exists (D14) — a later `Course.basePrice` change never moves an existing cycle's price.

What money must never store, and never delete

No stored money counter exists anywhere — no balance column on Enrollment/Student/BillingCycle. The ledger is **append-only and never hard-deleted (D18/BI-5/BI-6)**: a correction is a new audited row; a refund is a `NOT_REFUNDED → REFUNDED` status transition plus a REFUND row, never a value erase. Every money write is audited as a critical business action.

---

# Naming

## Models

Use PascalCase.

Examples

Student

Teacher

Course

Enrollment

Attendance

Tuition

Invoice

Guardian

AuditLog

Role

Permission

---

## Database Tables

Use Prisma default naming.

Do not override table names unless required.

---

## Fields

Use camelCase.

Examples

firstName

lastName

dateOfBirth

guardianPhone

billingCycleSessions

createdAt

updatedAt

deletedAt

Never abbreviate field names.

Bad

fn

dob

addr

---

# Primary Keys

Every model must have

id String @id @default(cuid())

Do not expose database IDs as business identifiers.

Business identifiers should use dedicated fields.

Examples

studentCode

teacherCode

courseCode

invoiceNumber

---

# Business Codes

Business codes must be unique.

Examples

HS-000001

GV-000001

COURSE-000001

INV-202600001

Business codes are immutable after creation.

---

# Timestamps

Every business entity should include

createdAt

updatedAt

deletedAt (optional)

Example

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

deletedAt DateTime?

Prefer soft delete.

---

# Soft Delete

Business entities must use

deletedAt

Never permanently delete

Students

Teachers

Courses

Invoices

Attendance

Payments

Audit Logs

Only use hard delete for

Temporary tokens

Sessions

Verification codes

Refresh tokens (optional)

Cache tables

---

# Audit Fields

When applicable

createdById

updatedById

deletedById

Store actor information whenever possible.

---

# Relations

Always use explicit relations.

Bad

studentId String

Good

student Student @relation(...)

studentId String

Always define both relation and foreign key.

---

# Relation Naming

Singular

student

teacher

course

Plural

students

teachers

courses

Use meaningful relation names.

---

# Junction Tables

Many-to-many relationships must use explicit junction tables.

Example

Enrollment

Student

↓

Enrollment

↓

Class

Never rely on implicit many-to-many.

This allows future expansion.

Example

Enrollment

status

joinedAt

billingCycleSessions

discount

notes

_(Note: `remainingLessons` was removed from these examples by Reflection Meeting decision,
2026-07-08 — remaining lessons are DERIVED (Derived Balance rule), never stored as a column.)_

---

# Nullable Fields

Only make fields nullable when necessary.

Avoid excessive optional fields.

If a value should always exist,

make it required.

---

# Enum

Use enums instead of strings.

Example

StudentStatus

Gender

PaymentStatus

AttendanceStatus

EnrollmentStatus

Never store business states as free text.

---

# Money

Never use Float.

Use

Decimal

or

Integer (smallest currency unit)

Examples

tuitionFee Decimal

amount Decimal

discount Decimal

Money is evidence, never a stored counter. Balances (outstanding, revenue, credit) are derived queries over the append-only `LedgerEntry`, never a balance column — see "Money: Financial Evidence (Ledger) → Derived Money" above. Ledger amounts are stored **unsigned**; the per-type sign algebra lives only in `DerivedMoneyService`.

---

# Dates

Store

UTC only.

Convert timezone only in frontend.

Never store formatted date strings.

---

# Boolean

Only use Boolean for true/false states.

Never encode booleans as strings.

Bad

"YES"

"NO"

---

# Indexes

Add indexes only when necessary.

Always consider indexes for

Foreign Keys

Unique Codes

Email

Phone

Status

Frequently filtered fields

Do not create indexes blindly.

---

# Unique Constraints

Business identifiers must be unique.

Examples

studentCode

teacherCode

email (if required)

phone (if required)

Use database constraints.

Never rely only on application validation.

---

# Transactions

Use Prisma transactions when

Creating multiple related records that must succeed or fail together

Financial operations that mutate multiple rows

Never use transactions for simple CRUD.

**Pooled-connection constraint (production evidence, 2026):** Prisma interactive transactions
are unreliable over pgbouncer transaction-pooling (`Transaction not found` incident on
ClassesService). Prefer designs that do not need multi-row atomicity: database constraints +
idempotent single-row writes + derived reads. The Attendance/completion path is deliberately
transaction-free (see "Attendance: Participation Evidence" above and RFC-001). When true
multi-row atomicity is unavoidable, escalate the design to the Architect — do not default to
`$transaction`.

_(Corrected by Reflection Meeting decision, 2026-07-08 — this section previously mandated
transactions for Enrollment/Attendance/Payment, contradicting both the "never for simple CRUD"
rule below it and the implemented, approved architecture.)_

---

# Concurrency

Use database constraints first.

Handle race conditions with

Unique Constraints

Retry Strategy

Transactions only when required.

---

# Query Rules

Never use

findMany()

without pagination

for business data.

Always support

Pagination

Filtering

Sorting

Search

Select only required fields.

Never use include: true.

---

# Select

Prefer

select

instead of

include

Select only required columns.

Example

Student List

id

code

firstName

lastName

status

Do not fetch guardian, enrollments, payments unnecessarily.

---

# N+1 Queries

Avoid N+1.

Prefer

include

or

batch queries

when necessary.

Always profile before optimizing.

---

# Cascade Rules

Prefer

onDelete: Restrict

Business entities should not disappear automatically.

Use

Cascade

only for

Temporary data

Child records that have no meaning independently

---

# Business Data

Business history should never disappear.

Examples

Attendance

Invoices

Payments

Audit Logs

Keep historical data.

---

# Migration Rules

Every schema change requires

Migration

Review

Testing

Never edit existing migration files after they have been applied.

Always create a new migration.

---

# Seed Data

Only seed

Roles

Permissions

Admin User

System Settings

Do not seed production business data.

---

# Multi-tenancy

Future-ready.

Every business entity should be able to support

organizationId

schoolId

centerId

without major redesign.

Avoid assumptions that only one center will exist forever.

---

# File Storage

Database stores

URL

publicId

metadata

Never store binary files.

Images

Documents

Videos

should be stored in cloud storage.

---

# Validation

Database constraints

are the final line of defense.

Application validation

does not replace

database validation.

---

# Performance

Prefer

Simple queries

Proper indexes

Pagination

Small payloads

Avoid premature optimization.

Measure first.

Optimize later.

---

# AI Development Rules

When creating new models:

- Reuse existing conventions.
- Keep naming consistent.
- Prefer explicit relations.
- Add timestamps.
- Use soft delete for business entities.
- Add proper indexes when justified.
- Avoid unnecessary nullable fields.
- Avoid duplicated data.
- Think about future scalability.
- Preserve historical business records.

Database design should prioritize long-term maintainability over short-term convenience.
