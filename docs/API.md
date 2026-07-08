# API.md

# API Standards

This document defines the API conventions for the Education Center Management SaaS.

Every endpoint must follow these standards to ensure consistency, maintainability, and predictable frontend integration.

---

# API Responsibilities

## User API → Authentication & Account Management

Endpoints: `/users`, `/auth`

Responsibilities:

- Login, logout, token refresh
- User CRUD (create accounts, assign roles)
- Password management
- Profile update (User-level display name, avatar)
- RBAC: role and permission assignment

User API must never expose or modify business profile data (Employee, Student, Guardian).

## Employee API → Business Profile CRUD

Endpoints: `/employees`

Responsibilities:

- Employee profile CRUD (personal info, job type, status)
- Auto-generated employee codes
- Search, filter, pagination
- Soft delete with audit log

Employee API must never handle authentication, passwords, tokens, or roles.

Linking an Employee to a User account is a separate future operation and must not be part of standard Employee CRUD.

## Class Schedule API → Planning Layer CRUD

Endpoints: `/class-schedules`

Responsibilities:

- CRUD for a Class's recurring weekly slots (weekday + startTime + endTime)
- Validation only: no duplicate (weekday, startTime) per Class, startTime < endTime, blocked while the parent Class is COMPLETED/CANCELLED

Class Schedule API must never create, modify, or delete Class Session rows. It is read-only input to the Scheduling API below.

## Class Session API → Execution Layer (read + manual exception only)

Endpoints: `/class-sessions`

Responsibilities:

- Read (list/detail), search, filter, pagination
- Update only: date, status, topic, note — a manual business exception (holiday, teacher request, reschedule), never classId or sessionNumber
- Status transition ONGOING → COMPLETED is additionally gated by the Session Completion Policy — see Attendance API (E1) below
- Soft delete, only while status is PLANNED or CANCELLED

There is no `POST /class-sessions`. Class Session is generated business data — see Scheduling API.

## Scheduling API → Generation Engine

Endpoints: `POST /classes/:id/generate-sessions`, `POST /classes/:id/sync-sessions`

Responsibilities:

- `generate-sessions`: create the full initial batch of Class Sessions from the Class's Class Schedule + startDate + sessionCount. Only when the Class is OPEN and has zero existing Sessions.
- `sync-sessions`: idempotently append only missing future Sessions after a schedule change (e.g. a new weekly slot was added). Never overwrites existing Sessions, never recreates a soft-deleted Session, never backfills a past date. Only when the Class is OPEN.
- Both return `{ generatedCount, existingCount, totalSessions }`.

## Attendance API → Participation Evidence

Endpoints: `/attendance`

Responsibilities:

- `POST /attendance/sessions/:sessionId` (`attendance.create`): idempotent bulk roster recording — body `{ records: [{ enrollmentId, status, note? }] }`, roster = ACTIVE enrollments of the session's class. Out-of-roster enrollments and inactive students are rejected. Writable-status matrix: PLANNED ❌ · ONGOING ✅ create + update · COMPLETED update existing rows only, never create (backfilling a past session would instantly consume a lesson; mid-cycle enrollment belongs to Payment) · CANCELLED ❌. Re-POSTing the same payload updates, never duplicates; unchanged rows produce no write and no audit entry. Returns the session's attendance rows.
- `GET /attendance` (`attendance.read`): list with filters `classSessionId | classId | studentId | status`, pagination + sorting, `{ items, meta }` envelope. `classId`/`studentId` filter through the enrollment relation.
- `PATCH /attendance/:id` (`attendance.update`): correction of status/note only. Within 48 hours of the session's end datetime (`date` + `endTime`), `attendance.update` suffices; after that the actor must also hold `attendance.correct` (403 otherwise). The same window applies to updates made through the bulk endpoint, so it cannot sidestep the correction rules. Correcting to a non-deducting status reverses consumption by construction (derived balance).

There is no `DELETE /attendance`. Attendance is participation evidence — corrections only, never deletes; every write is audited with before/after metadata.

Permissions: `attendance.read` / `attendance.create` / `attendance.update` → Super Admin, Admin, Teacher (first operational Teacher grant); `attendance.correct` (post-48h corrections) → Super Admin + Admin only.

E1 — session completion gate: `PATCH /class-sessions/:id` with `status: COMPLETED` returns 400 until every ACTIVE enrollment of the session's class has a recorded attendance status for that session (EXCUSED counts as finalized; an empty roster is trivially completable). The gate is wired through the Business Policy Interface (`SessionCompletionPolicy` interface + `SESSION_COMPLETION_POLICY` injection token): the attendance module provides the policy, the Class Session module injects only the token and never imports attendance internals. No consumption code runs at completion — the balance is derived.

---

# API Style

Use RESTful APIs.

Avoid RPC-style endpoints.

Good

GET /students

POST /students

PATCH /students/:id

DELETE /students/:id

Bad

POST /getStudents

POST /deleteStudent

GET /studentList

---

# Resource Naming

Use plural resource names.

Examples

/students

/teachers

/courses

/classes

/attendance

/tuitions

/users

/roles

/permissions

Never mix singular and plural.

---

# HTTP Methods

GET

Read data.

POST

Create resources.

PATCH

Partial update.

PUT

Only for full replacement.

Prefer PATCH.

DELETE

Soft delete business resources.

---

# URL Naming

Use kebab-case only when needed.

Avoid verbs.

Good

/students

/student-groups

Bad

/getStudent

/createStudent

---

# Response Format

Success

{
"success": true,
"message": "Student created successfully.",
"data": {}
}

Error

{
"success": false,
"message": "Student not found."
}

Do not expose stack traces.

---

# Pagination

All list endpoints must support pagination.

Query

?page=1

&limit=20

Response

{
"success": true,
"data": {
"items": [],
"pagination": {
"page": 1,
"limit": 20,
"total": 156,
"totalPages": 8
}
}
}

Never return thousands of records.

---

# Search

Use

search

Example

/students?search=nguyen

Search should support business-friendly fields.

Examples

Student

Name

Code

Phone

Guardian

Teacher

Name

Phone

Course

Name

Code

---

# Filtering

Use query parameters.

Example

?status=active

?gender=male

?courseId=...

Combine filters.

Example

?page=1

&status=active

&search=an

---

# Sorting

Use

sortBy

sortOrder

Example

?sortBy=createdAt

&sortOrder=desc

Never hardcode sorting.

---

# Validation

Every request must be validated.

Use

class-validator

Never trust frontend validation.

---

# DTO

Every endpoint must have DTOs.

Create

Update

Query

Response (optional)

Never use Prisma models directly in controllers.

---

# Authentication

Protected endpoints require JWT.

Public endpoints must explicitly use

@Public()

Never rely on frontend authentication.

---

# Authorization

Every protected endpoint must verify permissions.

Example

student.read

student.create

student.update

student.delete

Never rely only on UI permissions.

---

# Error Handling

Throw proper HTTP exceptions.

Examples

400

Bad Request

401

Unauthorized

403

Forbidden

404

Not Found

409

Conflict

422

Validation

500

Internal Server Error

Never return HTTP 200 for failed requests.

---

# Soft Delete

DELETE endpoints should perform soft delete unless explicitly documented otherwise.

Deleted records should not appear in list endpoints.

---

# Batch Operations

When appropriate, support batch endpoints.

Examples

POST /students/import

POST /students/export

DELETE /students/bulk-delete

Batch operations must validate every item.

---

# File Upload

Use dedicated upload endpoints.

Example

POST /uploads/image

Return

{
"success": true,
"data": {
"url": "...",
"publicId": "..."
}
}

Business entities should only store URLs.

---

# Relationships

Use resource identifiers.

Example

POST /enrollments

{
"studentId": "...",
"classId": "..."
}

Do not send nested business objects.

---

# Versioning

Prepare APIs for versioning.

Example

/api/v1/students

Avoid breaking existing clients.

---

# Idempotency

GET

Always idempotent.

PATCH

Should be idempotent.

DELETE

Should safely return success when appropriate if the resource is already deleted.

POST

Not idempotent unless explicitly designed.

---

# Query Performance

Always

Select required fields.

Use pagination.

Avoid N+1 queries.

Never return unnecessary nested objects.

---

# Response Size

List endpoints should return lightweight objects.

Detail endpoints may include additional related information.

Never return unnecessary relations.

---

# Audit

Critical business endpoints must create audit logs.

Examples

Create

Update

Delete

Role Assignment

Permission Change

Tuition Payment

Enrollment

Attendance

---

# API Documentation

Every endpoint should include

Summary

Description

Request DTO

Response DTO

Permission

Swagger decorators should be maintained.

---

# Frontend Compatibility

API responses should remain stable.

Avoid changing response structure after release.

If changes are required,

prefer additive changes.

---

# Naming Consistency

Examples

studentId

teacherId

courseId

classId

guardianId

Never mix

studentID

student_id

StudentId

---

# AI Development Rules

When implementing new endpoints:

- Follow REST principles.
- Use DTO validation.
- Use permission guards.
- Return consistent response structures.
- Support pagination for list endpoints.
- Support search, filtering, and sorting where appropriate.
- Avoid breaking existing APIs.
- Never expose internal database structures.
- Keep endpoints predictable and consistent across all modules.

Every API should be simple, secure, scalable, and easy for frontend integration.
