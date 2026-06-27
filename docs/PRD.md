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
