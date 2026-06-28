# API.md

# API Standards

This document defines the API conventions for the Education Center Management SaaS.

Every endpoint must follow these standards to ensure consistency, maintainability, and predictable frontend integration.

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
