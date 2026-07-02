# PRD.md

# Education Center Management SaaS

## Product Vision

Build a modern SaaS platform that digitizes the daily operations of education centers, replacing spreadsheets and manual processes with a simple, scalable, and automated system.

The platform should help owners manage students, teachers, classes, tuition, attendance, and business operations from a single dashboard.

---

# Target Users

- Owner
- Manager
- Receptionist
- Teacher
- Parent
- Student

---

# Product Goals

- Reduce manual administrative work.
- Centralize all operational data.
- Improve communication between center, teachers, and parents.
- Provide real-time business insights.
- Support future multi-tenant SaaS deployment.

---

# Core Modules

## Authentication

- Login
- Forgot Password
- RBAC
- User Profile

---

## Employee

- Employee Profile (name, contact, gender, date of birth, address, avatar)
- Employee Type (Teacher, Receptionist, Accountant, Academic, Manager, Director, Other)
- Employment Information (hire date, status, notes)
- Auto-generated employee code (NV-001, NV-002, ...)
- Search, filter by type and status, pagination
- Soft delete with audit log
- Optional linked User account for system login

### Optional Login Account

An employee exists as a business profile independent of any system account.

When an employee needs to log in to the system, a User account can be linked to their Employee profile.

This link is optional and managed separately from the Employee CRUD.

Employee personal data (name, phone, email) always lives in the Employee record, never duplicated in User.

---

## Student

- Student Profile
- Guardian Information
- Enrollment History
- Status Management

---

## Teacher

- Teacher Profile
- Teaching Assignment
- Teaching Schedule

---

## Course

- Course
- Subject
- Level
- Tuition Plan

---

## Class

- Class
- Classroom
- Capacity
- Schedule
- Teacher Assignment

---

## Attendance

- Student Attendance
- Teacher Attendance
- QR Attendance (Future)

---

## Tuition

- Tuition Plans
- Payment History
- Outstanding Balance
- Remaining Lessons
- Invoices

---

## Parent Portal (Future)

Parents will have a User account linked to a Guardian profile.

The Guardian profile holds business data (name, relationship, contact).

The User account provides login and permission to view their child's attendance, tuition, and progress.

This follows the same pattern as Employee ↔ User.

---

## Student Portal (Future)

Adult students may have a User account linked to their Student profile.

The Student profile holds enrollment and academic data.

The User account provides login and permission to view their own schedule and progress.

---

## Scheduling

- Weekly Schedule
- Holiday
- Makeup Class
- Reschedule

---

## Notifications

- Tuition Reminder
- Attendance Notification
- Class Announcement

---

## Reports

- Revenue
- Student Statistics
- Attendance
- Teacher Performance

---

## CRM

- Lead Management
- Trial Classes
- Enrollment Pipeline
- Follow-up

---

# Business Rules

- Every student belongs to at least one class.
- Every class has one assigned teacher.
- Attendance deducts remaining lessons.
- Tuition belongs to an enrollment.
- Inactive students cannot attend classes.
- Soft delete should be preferred.
- Critical actions should be auditable.

---

# Non-functional Requirements

- Responsive UI
- Fast loading
- Secure authentication
- REST API
- Scalable architecture
- Mobile-ready
- Production-ready

---

# Out of Scope

These features are intentionally excluded from MVP:

- Online Learning
- Video Streaming
- Online Exams
- AI Assistant
- Mobile Applications
- Marketplace
- Multi-language

---

# Success Criteria

The system should allow a center to:

- Manage students efficiently.
- Record attendance quickly.
- Manage tuition accurately.
- Generate reports instantly.
- Operate daily activities without Excel.
