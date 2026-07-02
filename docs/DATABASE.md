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

remainingLessons

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

remainingLessons

discount

notes

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

Creating multiple related records

Updating multiple business entities

Financial operations

Enrollment

Attendance

Tuition Payment

Invoice

Never use transactions for simple CRUD.

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
