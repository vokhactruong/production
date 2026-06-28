# CONVENTIONS.md

# Coding Conventions

This document defines the coding standards for the Education Center Management SaaS.

Every module, feature, component, API, database model, and business logic must follow these conventions.

If any convention conflicts with a task request, ask for clarification instead of making assumptions.

---

# General Principles

Always prioritize:

1. Simplicity
2. Readability
3. Consistency
4. Maintainability
5. Scalability

Avoid over-engineering.

Do not introduce abstractions unless they solve a real problem.

---

# Code Quality

Code must be:

- Small
- Predictable
- Testable
- Reusable

Avoid:

- Duplicate logic
- Deep nesting
- Magic numbers
- Hardcoded strings
- Unused variables
- Dead code

---

# Naming

## Files

Use kebab-case.

Good

student-form.tsx

student.repository.ts

auth.service.ts

Bad

StudentForm.tsx

studentRepository.ts

---

## React Components

Use PascalCase.

StudentForm

StudentTable

DashboardCard

---

## Functions

Use camelCase.

Good

createStudent()

findStudent()

calculateRemainingLessons()

Bad

CreateStudent()

student_create()

---

## Variables

Use descriptive names.

Good

student

guardian

remainingLessons

totalRevenue

Bad

obj

item

tmp

data1

---

## Boolean Variables

Always prefix with:

is

has

can

should

Examples

isActive

hasPermission

canEdit

shouldRetry

---

# Folder Structure

Feature-based architecture.

Example

features/

students/

teachers/

courses/

attendance/

tuition/

crm/

Each feature should contain

api/

components/

hooks/

pages/

types/

constants/

utils/

Never create global folders unless truly shared.

---

# Backend Architecture

NestJS architecture:

Controller

↓

Service

↓

Repository

↓

Prisma

Rules

Controllers

- HTTP only
- Validation
- Authorization
- No business logic

Services

- Business logic only

Repositories

- Database access only

Never access Prisma directly inside controllers.

Never put business logic inside repositories.

---

# Frontend Architecture

Components should be:

Small

Reusable

Focused

Prefer composition over inheritance.

Never fetch data directly inside UI components.

Use feature hooks.

Example

useStudents()

useStudent()

useCreateStudent()

---

# TanStack Query

Never hardcode query keys.

Create key factories.

Example

studentKeys.all

studentKeys.detail(id)

studentKeys.list(filters)

Update

setQueryData(detail)

invalidateQueries(list)

Delete

removeQueries(detail)

invalidateQueries(list)

Never call APIs directly inside components.

---

# Forms

Use

React Hook Form

-

Zod

Never use uncontrolled validation.

Always validate on both frontend and backend.

---

# UI Components

Prefer existing shared components.

Examples

Button

Dialog

DataTable

Card

Input

Badge

Avatar

Do not duplicate UI components.

---

# Styling

Use Tailwind CSS.

Rules

No inline styles.

Use utility classes.

Extract repeated styles into reusable components.

Maintain consistent spacing.

Preferred spacing scale

4

6

8

12

16

24

32

---

# Loading States

Every async page must support

Loading

Empty

Error

Success

Never leave blank screens.

---

# Empty States

Every list must have an Empty State.

Include

Illustration

Description

Primary Action

---

# Error Handling

Never expose raw errors.

Backend

Throw HttpException.

Frontend

Display friendly toast.

Log unexpected errors.

---

# Logging

Never use console.log in production code.

Use application logger.

Log only meaningful events.

Never log

Passwords

Tokens

Sensitive data

---

# Validation

Validate every request.

Frontend

Zod

Backend

class-validator

Never trust frontend validation.

---

# Permissions

Never hide security behind UI.

Frontend

Hide buttons.

Backend

Always verify permissions.

Every protected endpoint must use permission guards.

---

# Accessibility

Every interactive element must support

Keyboard

Screen readers

Focus management

Dialogs

Escape key

Focus trap

Buttons with icons

aria-label

Tabs

Proper ARIA roles

---

# Performance

Avoid unnecessary renders.

Use

useMemo

useCallback

only when beneficial.

Avoid premature optimization.

Backend

Avoid N+1 queries.

Select only required fields.

Use pagination.

---

# API Calls

Never call fetch directly.

Use centralized API client.

All requests should go through feature APIs.

Example

students.api.ts

teachers.api.ts

---

# Constants

Never hardcode labels.

Create constants.

Example

STATUS_CONFIG

ROLE_CONFIG

GENDER_LABEL

---

# Enums

Use enums instead of string literals.

Good

StudentStatus.ACTIVE

Bad

"ACTIVE"

---

# Dates

Store all timestamps in UTC.

Convert only at presentation layer.

Never mix timezone logic with business logic.

---

# Soft Delete

Prefer soft delete.

Use

deletedAt

Never permanently delete business data unless explicitly required.

---

# Audit Log

Every critical action must create an audit log.

Examples

Create

Update

Delete

Permission Change

Tuition Payment

Role Assignment

Audit logs should include

Actor

Action

Target

Timestamp

Metadata

---

# Business Logic

Business rules belong only inside services.

Never inside

Controllers

Repositories

Components

---

# Reusability

Before writing new code ask:

Can this be reused?

Can an existing component solve this?

Avoid duplication.

---

# Comments

Write code that explains itself.

Only add comments when explaining

Why

not

What

---

# Imports

Import order

1. React
2. External libraries
3. Shared packages
4. Feature modules
5. Relative imports
6. Types

Keep imports sorted.

---

# File Organization

Preferred order

Imports

Constants

Types

Hooks

Component

Helpers

Exports

---

# Testing Mindset

Before considering a task complete verify

Build passes

Lint passes

Type check passes

No console errors

Permissions work

Loading state works

Error state works

Empty state works

Responsive layout works

---

# AI Development Rules

When implementing a new feature:

- Reuse existing architecture.
- Do not refactor unrelated modules.
- Do not introduce unnecessary abstractions.
- Follow BUSINESS.md.
- Follow PRD.md.
- Follow ROADMAP.md.
- Follow BACKEND.md.
- Follow FRONTEND.md.
- Follow CACHE.md.

If unsure, ask one clarifying question before coding.

The goal is to produce code that is consistent, maintainable, production-ready, and aligned with the existing project architecture.
