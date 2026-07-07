# PROJECT_ANALYSIS.md

> **Sprint 0 — Foundation. Deliverable: understanding only.**
> This document records the current state of the repository as observed on 2026-07-05.
> It does not propose a new architecture, does not redesign anything, and does not modify
> source or existing documentation. Where it lists risks, debt, or gaps, these are
> observations for later sprints — not decisions.
> Authored by: Lead Implementation Engineer. Awaiting Founder / System Architect review.

---

## 1. Executive Summary

The repository is a **TurboRepo + PNPM monorepo** implementing an **Education Center Management SaaS** (the product docs call it "Education Center SaaS"; the repo/README is named `school-portal`). It is a real, working production-oriented codebase — not an AI prompt or a toy project.

It contains three deployable apps and six shared packages:

- `apps/api` — NestJS 10 backend (REST, Prisma, PostgreSQL, JWT + Google OAuth, RBAC).
- `apps/admin` — React 19 + Vite admin portal (the operational cockpit).
- `apps/web` — Next.js 15 public site (Vietnamese news/article front-end).
- `packages/*` — `types`, `constants`, `auth`, `validators`, `ui`, plus `database` (Prisma schema, migrations, seed).

The product is mid-build. **Phase 1 (Foundation)** and most of **Phase 2 (Core Operations)** are implemented: Auth, RBAC, Users, Roles, Permissions, Audit Logs, Upload, Dashboard, Categories/Articles (CMS), Students, Subjects, Courses, Employees (+ Employee↔User linking), Classrooms, Classes, Enrollments, and the **Scheduling Engine v1** (ClassSchedule planning layer → ClassSession execution layer). The next major business features — **Attendance, Tuition/Payment, Notifications, CRM** — are documented but **not yet implemented**.

The codebase is disciplined and convention-heavy: a well-defined layered backend (Controller → Service → Repository → Prisma), a feature-based frontend (Feature → API → Hooks → Components → Pages), extensive written standards in `/docs`, soft-delete + audit-log conventions, and a consistent API response envelope. The most notable observations are (a) a **large body of implemented but uncommitted work** (Classroom → Scheduling modules are untracked in git), (b) **no automated tests anywhere**, and (c) several **documentation-vs-code drifts** (duplicate permission sources, stale Swagger tags, an internal contradiction about whether "AI" is in the MVP).

For the AI-DOS effort specifically: there is currently **no AI operating layer** beyond a root `CLAUDE.md` (project rules) and a minimal `.claude/settings.json`. No Constitution, Knowledge Base, commands, or agents exist yet. This document is the first artifact under `docs/AI/`.

---

## 2. Product Overview

**Product:** A SaaS platform to digitize the daily operations of small/medium education centers, replacing Excel, paper, and manual processes.

**Primary user personas (from PRD):** Owner, Manager, Receptionist, Teacher, Parent, Student.

**Core product surfaces:**

| Surface      | App          | Purpose                                                                                                                       |
| ------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Admin Portal | `apps/admin` | Staff operations: manage students, employees, courses, classes, schedules, enrollments, RBAC, CMS. Desktop-first.             |
| Public Site  | `apps/web`   | Public-facing Vietnamese content site: news, categories, article detail (`/tin-tuc`, `/danh-muc/[slug]`, `/bai-viet/[slug]`). |
| REST API     | `apps/api`   | Single backend serving both. Swagger at `/api/docs`.                                                                          |

**Product principle (BUSINESS.md):** every feature must save time, reduce mistakes, increase revenue, or improve parent satisfaction — otherwise it is not built. Stability > Business Value > New Features (ROADMAP).

**MVP scope (3 months, BUSINESS.md):** Authentication, Dashboard, Student, Subject, Course, Employee, Classroom, Class, Enrollment, ClassSession, Attendance, Payment, Invoice, Guardian, Notification, CRM, AI. _(Note: "AI" appears in both the Included and Not-Included lists — see §18/§22.)_

---

## 3. Business Overview

The business domain is a **tuition / education center** (not a K-12 school administration system, despite the `school-portal` name and the high-school-flavored seed content).

**Highest-priority business problems (BUSINESS.md, ⭐ ratings):**

1. **Tuition Management** ⭐⭐⭐⭐⭐ — automatic tuition calculation, remaining-lesson tracking, outstanding balances, reminders, online payment. _(Not yet implemented.)_
2. **Attendance** ⭐⭐⭐⭐⭐ — fast attendance, automatic lesson deduction, parent notifications. _(Not yet implemented.)_
3. **Scheduling** ⭐⭐⭐⭐⭐ — weekly schedules, reschedule, teacher replacement. _(Planning + execution layers implemented; automation deferred.)_
4. **Makeup Classes** ⭐⭐⭐⭐⭐ — leave requests, approval, makeup assignment. _(Not yet implemented.)_
5. **Parent Communication** ⭐⭐⭐⭐⭐ — broadcasts, alerts. _(Not yet implemented.)_
6. **Student Progress** ⭐⭐⭐⭐⭐ — grades, comments, progress reports. _(Not yet implemented.)_
7. **Teacher Management** ⭐⭐⭐⭐☆ — workload, payroll support. _(Partially: Employee module exists.)_
8. **CRM & Admissions** ⭐⭐⭐⭐⭐ — leads, trials, pipeline. _(Not yet implemented.)_
9. **Reports & Dashboard** ⭐⭐⭐⭐⭐ — revenue, growth, analytics. _(Basic dashboard exists.)_
10. **Future AI** — comments, summaries, chatbot, dropout prediction. _(Future.)_

**Success metrics (targets):** register a student < 2 min, record attendance < 10 s, collect tuition < 1 min, real-time revenue, ≥ 50% reduction in manual admin work.

**Key business rules already encoded in the system:**

- **Course is a template only** — it must never carry teacher, classroom, schedule, or dates. `packageLessons`, `lessonDuration`, `basePrice` are **snapshotted** into a Class at creation; later Course edits must not affect existing Classes.
- **Planning vs Execution separation** — `ClassSchedule` (recurring weekly template) is the source of truth; `ClassSession` is generated history. Editing the template never rewrites already-generated sessions.
- **`sessionNumber` is a permanent business identifier** — never reused, even across soft-deletes (full unique constraint, `MAX()` computed across deleted rows).
- **Employee ≠ User** — an Employee is a business profile; a User is a login account; they are optionally 1-to-1 linked.

---

## 4. Business Workflow

The central operational pipeline (BUSINESS.md, ROADMAP.md):

```
Course  →  Class  →  Class Schedule  →  Generate Sessions  →  Class Session  →  Attendance  →  Payment  →  Invoice
(template) (offering) (planning layer)   (engine)            (execution layer)  (future)      (future)   (future)
```

**Implemented portion of the workflow:**

1. **Catalog setup** — Admin creates `Subject`, then `Course` (template) under a Subject.
2. **Physical setup** — Admin creates `Classroom` and `Employee` (teacher) records.
3. **Class creation** — Admin creates a `Class` from a Course (snapshotting package/price), assigning classroom + teacher, with `status = PLANNING`.
4. **Planning** — Admin defines the `ClassSchedule` (weekly slots) while `PLANNING`/`OPEN`.
5. **Open + generate** — Class moves to `OPEN`; Admin calls `POST /classes/:id/generate-sessions` (only when OPEN and zero sessions exist) to create the initial `ClassSession` batch from schedule + `startDate` + `sessionCount`.
6. **Enrollment** — Students are enrolled into a Class via `Enrollment` (one ACTIVE enrollment per student per class enforced by partial unique index).
7. **Schedule changes** — After adding a weekly slot, Admin calls `POST /classes/:id/sync-sessions` to idempotently append only missing _future_ sessions (never overwrites, never recreates a deleted session, never backfills the past).
8. **Session exceptions** — A single session's date/status/topic/note can be manually edited (holiday, teacher request, reschedule) — an exception that never writes back to the schedule.

**Class-status → allowed-operation matrix (BUSINESS.md):**

| Class status | Class Schedule | Generate Sessions            | Sync Missing Sessions |
| ------------ | -------------- | ---------------------------- | --------------------- |
| PLANNING     | editable       | blocked                      | blocked               |
| OPEN         | editable       | allowed (only if none exist) | allowed               |
| COMPLETED    | locked         | blocked                      | blocked               |
| CANCELLED    | locked         | blocked                      | blocked               |

**Not yet built (workflow tail):** Attendance (references Enrollment + ClassSession), Payment (consumes Attendance + Enrollment + ClassSession), Invoice, Notifications.

A separate, parallel workflow exists for the **CMS**: Category → Article (DRAFT → REVIEW → PUBLISHED → ARCHIVED) surfaced on `apps/web`.

---

## 5. Folder Structure

```
school-portal/
├─ apps/
│  ├─ api/          NestJS backend
│  │  └─ src/
│  │     ├─ <module>/            (auth, users, roles, permissions, categories,
│  │     │                        articles, upload, audit-logs, dashboard,
│  │     │                        students, subjects, courses, employees,
│  │     │                        classrooms, classes, enrollments,
│  │     │                        class-sessions, class-schedules, scheduling)
│  │     │   ├─ *.controller.ts
│  │     │   ├─ *.service.ts
│  │     │   ├─ *.repository.ts  (present in some modules, not all)
│  │     │   ├─ *.module.ts
│  │     │   └─ dto/*.dto.ts
│  │     ├─ common/  (filters, interceptors, decorators)
│  │     ├─ prisma/  (PrismaModule/Service)
│  │     └─ main.ts
│  ├─ admin/        React 19 + Vite
│  │  └─ src/
│  │     ├─ features/<name>/  (api/, hooks/ [incl. query-keys], services/…)
│  │     ├─ pages/<name>/     (route components)
│  │     ├─ components/       (shared UI: Can, DeleteDialog, Header, Toast…)
│  │     ├─ layouts/          (AdminLayout)
│  │     ├─ store/            (Zustand auth.store)
│  │     ├─ constants/        (permissions.ts — the live permission list)
│  │     ├─ lib/              (api-client, query-client)
│  │     └─ types/, utils/
│  └─ web/          Next.js 15 App Router (Vietnamese routes: bai-viet, danh-muc, tin-tuc)
├─ packages/
│  ├─ types/        shared TS domain interfaces
│  ├─ constants/    ROLES, PERMISSIONS (partial/stale), ROUTES, API_ROUTES
│  ├─ auth/         JWT payload type + permission/role/token helpers
│  ├─ validators/   Zod schemas (auth/user/role/category/article only)
│  └─ ui/           shared React components (Button, Modal, Table, …)
├─ database/
│  └─ prisma/       schema.prisma, migrations/, seed.ts
├─ docs/            BUSINESS, PRD, ROADMAP, CONVENTIONS, BACKEND, FRONTEND,
│                   DATABASE, API, CACHE, QUERY_KEYS   (+ this new docs/AI/)
├─ .github/workflows/ci.yml
├─ .husky/          (pre-commit → lint-staged, commit-msg → commitlint)
├─ CLAUDE.md        project rules (AI instruction file)
├─ .claude/settings.json
├─ docker-compose.yml (postgres:16, redis:7)
├─ turbo.json, pnpm-workspace.yaml, package.json
```

**Observations:**

- Frontend feature folders in practice hold `api/` and `hooks/` (with a `query-keys.ts`); `components/`, `pages/`, `types/`, `constants/`, `utils/` from CONVENTIONS are used selectively — pages live under top-level `src/pages/`, not inside each feature.
- The backend **Repository layer is inconsistent**: `courses`, `students`, `subjects`, `employees` have `*.repository.ts`; `users`, `roles`, `auth`, `articles`, `categories`, `dashboard`, and the newer `classes`/`enrollments`/`class-sessions`/`class-schedules`/`scheduling` do not appear to (services likely call Prisma more directly). See §18.

---

## 6. Architecture

**Monorepo:** TurboRepo orchestrates tasks (`dev`, `build`, `lint`, `type-check`, `clean`); PNPM workspaces span `apps/*`, `packages/*`, `database`. Root `build` filters to `@school/api` only (admin/web build/deploy separately — both have `vercel.json`).

**Backend (NestJS):**

```
HTTP → Controller → Service → (Repository) → Prisma → PostgreSQL
```

- Global cross-cutting: `AuthGuard` (JWT + permission enforcement, wired per-route), `ThrottlerGuard` (global, 60 req/60 s), `TransformInterceptor` (success envelope), `LoggingInterceptor`, `AllExceptionsFilter` (error envelope). `helmet`, `cookie-parser`, strict CORS allow-list, global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform).
- `@nestjs/schedule` and `@nestjs/throttler` are registered; Swagger via `@nestjs/swagger`.
- Business logic lives in services; DTOs validate input via `class-validator`.

**Frontend (Admin):**

```
Feature → API (axios) → Hooks (TanStack Query) → Components → Pages
```

- Data fetching only through feature hooks; centralized `api-client` with an auth refresh interceptor; Zustand `auth.store` for auth state (selector subscriptions per CONVENTIONS); TanStack Query with per-feature key factories and a documented cache/mutation strategy (CACHE.md / QUERY_KEYS.md); React Hook Form + Zod; Tailwind; route-level permission gating (`PermissionRoute`, `ProtectedRoute`, `PublicRoute`) and a `<Can>` component for element-level gating.

**Public site (web):** Next.js 15 App Router, server components fetching published articles/categories via `app/lib/api.ts`.

**Infrastructure (dev):** Docker Compose provides `postgres:16-alpine` and `redis:7-alpine`. **Redis is provisioned but not referenced in application code** (no Redis client observed) — see §18. External services: **Cloudinary** (image upload/storage), **Google OAuth**. Config via env (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, Google, Cloudinary).

---

## 7. Module Relationship

**Backend modules registered in `app.module.ts`:** Prisma, Auth, Users, Roles, Permissions, Categories, Articles, Upload, AuditLogs, Dashboard, Students, Subjects, Courses, Employees, Classrooms, Classes, Enrollments, ClassSessions, ClassSchedules, Scheduling.

**Domain relationships (from schema + services):**

```
User ──< UserRole >── Role ──< RolePermission >── Permission        (RBAC)
User 1─0..1 Employee                                                (optional login link)
User 1─N RefreshToken, OAuthAccount, Article, AuditLog

Subject 1─N Course        Subject 1─N Class
Course  1─N Class          (Course = template; Class snapshots package/price)
Classroom 1─N Class        Employee 1─N Class   (teacher)
Class 1─N ClassSchedule    (planning layer)
Class 1─N ClassSession     (execution layer, generated)
Class 1─N Enrollment ── N─1 Student
Category 1─N Article ── N─1 User (author)
```

**Cross-module coupling of note:**

- `SchedulingService` (module `scheduling`) reads `ClassSchedule` + `Class` fields to write `ClassSession` — the only writer of sessions. `ClassSchedule` and `ClassSession` have **no direct FK**; the link is computation-only.
- `EmployeesService` reaches into `User`/`Role` tables directly to link/create login accounts and writes `AuditLog` in the same transaction.
- `AuthService.buildUserPermissions` aggregates Role→Permission into the JWT at token issue time.
- Nearly every write path depends on `AuditLogsService` (transaction-aware `log(..., tx)`).

---

## 8. Database

**Engine:** PostgreSQL 16. **ORM:** Prisma 5. All access through Prisma (raw SQL only in migrations).

**Models (`schema.prisma`):** `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `RefreshToken`, `OAuthAccount`, `Category`, `Article`, `Student`, `AuditLog`, `PendingDeletion`, `Subject`, `Employee`, `Course`, `Classroom`, `Class`, `ClassSchedule`, `ClassSession`, `Enrollment`.

**Enums:** `UserStatus`, `ArticleStatus`, `StudentStatus`, `Gender`, `SubjectStatus`, `CourseType`, `CourseStatus`, `EmployeeType`, `EmployeeStatus`, `ClassroomType`, `ClassStatus`, `ClassSessionStatus`, `EnrollmentStatus`.

**Conventions in force (DATABASE.md, verified in schema):**

- `id String @id @default(cuid())` everywhere; business codes are separate immutable fields (`NV-001`, `HS-…`, course/class/classroom codes).
- `createdAt` / `updatedAt` / `deletedAt` timestamps; **soft delete** for business entities.
- Money as `Decimal` (`Course.basePrice`), never Float.
- Explicit relations + FK indexes; status/filter indexes added deliberately.
- `onDelete` mostly restrictive; `Cascade` used for owned identity children (UserRole, RolePermission, RefreshToken, OAuthAccount, Article→author).

**Notable schema design decisions:**

- **Partial unique indexes** (expressed only in raw migration SQL, _not_ in the Prisma DSL) for `User.email`, `Classroom.code`, `Class.code`, `ClassSchedule (classId, weekday, startTime)`, and `Enrollment (studentId, classId) WHERE status='ACTIVE'` — all scoped `WHERE deletedAt IS NULL` so a soft-deleted value can be reused. **Consequence:** those fields are _not_ `@unique` in Prisma, so every lookup must use `findFirst({ where: { …, deletedAt: null } })`. This is a repeated, easy-to-violate convention (documented inline in the schema).
- **`ClassSession.sessionNumber`** is the deliberate exception: a **full** `@@unique([classId, sessionNumber])`, never reused, `MAX()` computed across soft-deleted rows.
- **`@db.Time`** used for `startTime`/`endTime` on schedules/sessions.

**Migrations:** 20 migration folders under `database/prisma/migrations/`, dated 2026-06-20 → 2026-07-08. The most recent eight (classroom, subject/course, class, enrollment, class-session, session-number, class-schedule) are **untracked in git** (see §18). A separate legacy `database/migrations/0001_init.sql` also exists.

**Seed (`seed.ts`):** seeds Permissions (69 codes), 6 Roles (Super Admin, Admin, Editor, Teacher, Student, Parent), role→permission grants, 3 default users, 5 categories, 4 sample articles. Follows DATABASE.md ("seed only roles/permissions/admin/settings") except it also seeds demo categories/articles.

---

## 9. API

**Style:** RESTful, plural resources, standard verbs. Global response envelope via `TransformInterceptor`:

```json
{ "success": true, "data": {…}, "timestamp": "ISO" }
```

Error envelope via `AllExceptionsFilter`:

```json
{ "success": false, "statusCode": 4xx, "message": "…", "timestamp": "ISO", "path": "/…" }
```

_(Note: API.md documents a slightly different success shape `{ success, message, data }` and a paginated `data.pagination` object; the interceptor emits `data` + top-level `timestamp`, and list services return `{ items, meta:{ total,page,limit,totalPages } }`. Minor doc/impl drift — §18.)_

**Endpoint groups (from modules/controllers):** `/auth` (+`/auth/google`), `/users`, `/roles`, `/permissions`, `/categories`, `/articles`, `/upload`, `/audit-logs`, `/dashboard`, `/students`, `/subjects`, `/courses`, `/employees` (+ link/unlink/create-account, available-users), `/classrooms`, `/classes`, `/enrollments`, `/class-sessions`, `/class-schedules`, and the generation engine `POST /classes/:id/generate-sessions` + `POST /classes/:id/sync-sessions`.

**Conventions (API.md):** every list supports pagination/search/filter/sort; DTOs for create/update/query; permission guards on protected routes; `@Public()` for open routes; soft-delete DELETE; additive-only response evolution; audit on critical actions.

**Documentation:** Swagger served at `/api/docs`. **`addTag` in `main.ts` only registers tags up through Students** — Subjects, Courses, Employees, Classrooms, Classes, Enrollments, ClassSessions, ClassSchedules, Scheduling are untagged (doc debt, §18).

---

## 10. Authentication

**Mechanism:** JWT access token + opaque rotating refresh token; optional Google OAuth.

- **Access token:** signed JWT, default `15m`, carries `{ sub, email, roles[], permissions[] }`. Sent as `Authorization: Bearer`.
- **Refresh token:** 64-byte random, **SHA-256 hashed at rest** in `RefreshToken`, 7-day expiry, **rotated on every refresh** (old row deleted, new issued). Stored/read as an httpOnly cookie pattern (`COOKIE_NAMES.REFRESH_TOKEN`).
- **Passwords:** bcrypt, cost 12. `User.password` nullable (OAuth-only accounts have none).
- **JWT strategy** re-validates the user on every request (`findFirst deletedAt:null`, must be `ACTIVE`).
- **Google OAuth:** `passport-google`; new users auto-provisioned with the `Student` role; linked via `OAuthAccount`. A short-lived (60 s) **in-memory `Map`** holds one-time OAuth exchange codes.
- **Registration/self-serve:** `POST /auth/register` creates a User with the `Student` role.
- **Frontend:** single source of truth for the access token is `authStorage`; only Login / refresh interceptor / Logout may mutate it; refresh logic lives exclusively in the axios interceptor (CONVENTIONS "Authentication").

**Observation:** the OAuth-code `Map` and the general reliance on process-local state make the API **stateful**, which will not survive horizontal scaling (§20). Redis is available but unused.

---

## 11. Authorization

**Model:** RBAC — `User → UserRole → Role → RolePermission → Permission`. Permissions are fine-grained string codes (`student.read`, `class_session.generate`, …), 69 seeded.

**Backend enforcement:** the extended `AuthGuard` (`apps/api/src/auth/guards/auth.guard.ts`) runs Passport-JWT, then reads `@Permissions(...)` metadata and requires the user's JWT `permissions[]` to include **all** required codes, else `403`. `@Public()` bypasses. Permissions are **baked into the JWT at issue time** and rebuilt on login/refresh.

**Frontend enforcement:** route-level `PermissionRoute` (redirects to `/dashboard` if lacking permission) and element-level `<Can>` / `hasPermission` selector on the Zustand store. CONVENTIONS is explicit: UI hiding is cosmetic; the backend is authoritative.

**Seeded role → permission scope (seed.ts):**

- **Super Admin / Admin** — full operational + RBAC + CMS permissions (near-identical sets).
- **Editor** — dashboard + full Article lifecycle + category read + upload.
- **Teacher** — dashboard + limited article create/read/update + upload. _(No class/attendance permissions yet — teacher operational features aren't built.)_
- **Student / Parent** — dashboard view only.

**Observations:**

- **Stale permissions in a JWT:** a role/permission change does not take effect until the user's next refresh (≤15 min access-token window). Documented risk (§20).
- **Three permission source-of-truth locations** exist and have drifted: `database/seed.ts` (69 codes, authoritative for DB), `apps/admin/src/constants/permissions.ts` (complete, drives the admin UI/routes), and `packages/constants` `PERMISSIONS` enum (**stale** — only covers the original dashboard/user/role/article/category/upload/profile set, missing all Student→Scheduling codes; also includes `profile.update` which is not seeded). See §18.

---

## 12. Existing Documentation

Under `docs/` (all product/engineering docs are hand-maintained and detailed):

| Doc              | Role                                                                                          | State                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| BUSINESS.md      | Business goals, priorities, MVP scope, core business rules, scheduling-engine rationale       | Rich; one internal contradiction (AI in/out of MVP)            |
| PRD.md           | Product vision, personas, modules, business rules, scope                                      | Rich                                                           |
| ROADMAP.md       | Phases 1–7, current status, recorded architecture debt (multi-tenancy, Guardian)              | Rich, up to date (Scheduling Engine v1 entry dated 2026-07-05) |
| CONVENTIONS.md   | Full coding standards (naming, layering, Zustand, TanStack, forms, a11y, audit, soft delete…) | Comprehensive                                                  |
| BACKEND.md       | Layered backend rules                                                                         | Very thin (stub-like)                                          |
| FRONTEND.md      | Frontend rules, responsive philosophy, form rules                                             | Thin                                                           |
| DATABASE.md      | DB standards + User↔Employee and Scheduling-engine data-model rationale                       | Comprehensive                                                  |
| API.md           | API standards + module responsibility boundaries                                              | Comprehensive                                                  |
| CACHE.md         | TanStack Query mutation/cache patterns (A/B, create, delete, dashboard)                       | Comprehensive                                                  |
| QUERY_KEYS.md    | Query-key factory standards                                                                   | Comprehensive                                                  |
| README.md        | Stack, getting started, default credentials                                                   | Basic                                                          |
| CLAUDE.md (root) | AI project rules, doc precedence, architecture, quality gates                                 | The de-facto AI entry point                                    |

**Doc precedence (CLAUDE.md):** BUSINESS → PRD → ROADMAP → CONVENTIONS → technical docs.

---

## 13. Existing AI-DOS

There is currently **no AI Development Operating System** in the repository beyond two files:

1. **`CLAUDE.md`** (root) — the only real "AI governance" artifact today. It defines: doc-reading order and precedence, "ask one clarifying question," reuse-before-build rules, the Backend/Frontend architecture chains, quality gates (build/lint/type-check pass), security rules, and a priority order (Business Value → Simplicity → Consistency → Maintainability → Security → Performance).
2. **`.claude/settings.json`** — minimal; a single allow entry: `PowerShell(pnpm type-check 2>&1)`.

**Not present:** an AI Constitution, a Knowledge Base, reusable commands/prompts, defined agents/roles, ADRs, prompt libraries, generation templates, or any `docs/AI/` content (this file is the first). No `.cursor`, no other agent config.

**Implication for the AI-DOS build:** the raw material is strong — the `/docs` corpus is effectively an informal, human-readable knowledge base and standards library that a formal AI-DOS can codify. But there is no machine-oriented governance layer, no single source of truth the AI is contractually bound to, and no automation wrapping the existing quality gates.

---

## 14. Missing Documentation

Observed gaps (not judgments — inputs for later sprints):

- **No `docs/AI/` layer** (Constitution, KB, standards index, command catalog) — the purpose of this initiative.
- **BACKEND.md / FRONTEND.md are stubs** relative to the depth of CONVENTIONS/CACHE/DATABASE — much backend/frontend reality (repository pattern usage, module wiring, interceptors, error envelope, transaction rules) is undocumented or only implicit.
- **No architecture overview / system diagram doc** (monorepo topology, deploy targets, service dependencies, Cloudinary/Redis/Google boundaries).
- **No API reference beyond Swagger**, and Swagger tags are incomplete; no documented, authoritative response-envelope spec matching the actual interceptor.
- **No ADRs** capturing the several deliberate, non-obvious decisions (partial unique indexes, sessionNumber permanence, JWT-embedded permissions, snapshot-on-Class).
- **No environment / deployment / runbook doc** (Vercel for admin+web, Node host for API, migration-on-start via `pnpm start`).
- **No testing strategy doc** (because there are no tests).
- **No CHANGELOG / release notes**; module status is tracked informally inside ROADMAP.
- **No security / threat-model / data-retention doc** for a system holding minors' PII and (future) payment data.

---

## 15. Missing Knowledge

Knowledge that exists only implicitly in code or in a single person's head, and is not captured anywhere an AI (or new engineer) can reliably consume:

- **The partial-unique-index rule** (must use `findFirst + deletedAt:null`, never trust `@unique`) — documented only as inline schema comments, easy to miss.
- **Which modules use a Repository layer and which don't**, and the rule for when to introduce one.
- **The exact response/pagination contract** the frontend depends on (`{ items, meta }`, top-level envelope) vs. what API.md says.
- **The transaction + audit-log pairing pattern** (every critical write wraps repo call + `auditLogs.log(tx)` in `$transaction`) — a strong convention, but undocumented as a rule.
- **Business-code generation + retry-on-collision pattern** (e.g., `NV-###` with 5-retry P2002 handling in EmployeesService).
- **The Course→Class snapshot semantics** in code (which fields are copied, and that Course edits must not propagate).
- **The scheduling generation algorithm's guarantees** (idempotency, no-past-backfill, no-recreate-deleted) — described in prose in API/BUSINESS/DATABASE but not as an executable spec or test.
- **Domain glossary / bilingual mapping** — the product is Vietnamese-facing (UI strings, messages, seed data in Vietnamese) while code/domain terms are English; there is no glossary tying `NV-`=Employee (Nhân viên), `HS-`=Student (Học sinh), etc.

---

## 16. Missing Standards

- **Testing standard** — none exists (no unit/integration/e2e conventions, no coverage expectation). The only "testing" is a manual checklist in CONVENTIONS.
- **Commit/PR/branch standard beyond commitlint** — conventional commits are enforced by husky/commitlint, but there is no documented PR template, review checklist, or definition-of-done gate tied to the quality bar.
- **Error-code / message catalog** — user messages are inline Vietnamese string literals scattered across services (contradicting CONVENTIONS "never hardcode labels"); no centralized i18n or error catalog.
- **Repository-layer standard** — inconsistently applied; no rule for when it's required.
- **DTO/response-type standard** — response DTOs are optional in practice; `packages/types` is hand-mirrored against Prisma (drift risk).
- **Validation single-source standard** — Zod lives in `packages/validators` (only for older modules) _and_ inline in admin pages _and_ class-validator DTOs on the backend; no rule tying them together for newer modules.
- **Logging standard** — CONVENTIONS forbids `console.log`, but `seed.ts` uses `console.*` and there is no structured-logging convention for the app logger.
- **Multi-tenancy / data-scoping standard** — explicitly deferred but not yet standardized.

---

## 17. Missing Automation

- **No automated tests in CI** — `ci.yml` runs `install → prisma generate → (Next type stub) → lint → type-check → build`. No `test` step (nothing to run).
- **No pre-push / pre-merge quality gate** beyond pre-commit `lint-staged` (prettier) and commit-msg lint.
- **No AI-assisted automation** — no generation commands, no scaffolding for the highly-repetitive module pattern (each new module repeats controller/service/repo/dto + feature api/hooks/keys/pages by hand).
- **No migration/deploy automation docs or pipeline** visible beyond `pnpm start` running `db:migrate:prod` before boot.
- **No dependency / security scanning** (Dependabot, audit, SAST) in CI.
- **No coverage / bundle-size / performance budgets.**
- **`PendingDeletion` implies an intended background cleanup job** (Cloudinary orphan deletion with retry) — `@nestjs/schedule` is registered, but whether a cron actually drains it was not confirmed in this pass (worth verifying in a later sprint).

---

## 18. Technical Debt

Observed, evidence-based (severity is this engineer's read, subject to Architect override):

1. **Large uncommitted feature set (High).** Classroom, Class, Enrollment, ClassSession, ClassSchedule, Scheduling modules (backend + admin) and their eight migrations are **untracked in git** (`git status` shows `??`). Significant work is unversioned and unbacked-up.
2. **No automated tests anywhere (High).** Zero `*.spec.ts` / `*.test.ts`. Critical, subtle logic (scheduling idempotency, sessionNumber permanence, partial-unique reuse, enrollment race guard, token rotation) is unprotected against regression.
3. **Three drifting permission sources (Medium).** `seed.ts` (authoritative), `apps/admin/src/constants/permissions.ts` (complete, live), and `packages/constants` `PERMISSIONS` (stale, missing all newer codes, contains unseeded `profile.update`). `packages/validators` similarly only covers legacy modules.
4. **Incomplete Swagger tags (Low).** `main.ts` tags stop at Students; ~10 module groups undocumented in the OpenAPI UI.
5. **Doc-vs-impl response-shape drift (Medium).** API.md's documented success/pagination envelope differs from the actual `TransformInterceptor` + `{ items, meta }` reality — a frontend-contract hazard.
6. **Partial-unique-index fragility (Medium).** Correctness depends on every query manually adding `deletedAt: null`; not enforceable by the type system, only by discipline/inline comments.
7. **Inconsistent Repository layer (Low/Medium).** Some modules have repositories, newer ones apparently call Prisma from services — inconsistent with CONVENTIONS' four-layer rule.
8. **Hardcoded Vietnamese strings in services (Low).** Error/success messages inline, contradicting the "no hardcoded labels / use constants" convention; blocks i18n.
9. **Redis provisioned but unused (Low).** `docker-compose` runs Redis; no app usage — either dead infra or an unfinished intention (rate-limit/session/cache).
10. **In-memory OAuth code + process-local state (Medium).** Blocks horizontal scaling; also a restart loses in-flight OAuth exchanges.
11. **`packages/types` hand-mirrors Prisma (Low/Medium).** Manual duplication of domain shapes invites drift as the schema evolves.
12. **BUSINESS.md MVP contradiction (Low).** "AI" listed in both Included and Not-Included; PRD lists AI Assistant as out-of-scope. Ambiguous scope signal.
13. **`Super Admin` and `Admin` have near-identical permissions (Low).** Role distinction is currently cosmetic.

---

## 19. Business Risks

- **Revenue-critical features not yet built.** Tuition/Payment/Invoice and Attendance — the two ⭐⭐⭐⭐⭐ problems that most directly "reduce revenue loss" and "save teacher time" — are unimplemented. The product cannot yet fulfill its core value proposition (replace Excel for money + attendance).
- **PII / minors' data sensitivity.** The system stores students', guardians', and employees' personal data with no documented data-retention, consent, or security/threat model. Regulatory and reputational exposure grows as CRM and payments arrive.
- **Payment domain not modeled.** Introducing money later (Decimal is used, but no Payment/Invoice model exists) is high-stakes; financial correctness usually needs tests and audit — currently absent.
- **Single-tenant assumption vs. SaaS ambition.** PRD/DATABASE target multi-tenant SaaS, but no `organizationId` exists; onboarding a second center today is not possible without a breaking migration (documented in ROADMAP Phase 7).
- **Product identity ambiguity.** Repo naming, README, and `apps/web` content skew "school/news portal," while BUSINESS/PRD describe an "education-center operations SaaS." Misalignment can misdirect roadmap and stakeholder expectations.
- **Key-person / knowledge risk.** Deep, non-obvious rules live in code and one contributor's context; with no tests and thin backend/frontend docs, continuity depends on that context.

---

## 20. Architecture Risks

- **Stateful API blocks horizontal scaling.** In-memory OAuth code map (and general process-local assumptions) mean multiple API instances would behave inconsistently. Redis exists but is unused.
- **Permissions embedded in JWT → staleness window.** Role/permission revocation isn't effective until refresh (≤15 min). For a system that will gate payments and student data, this is a real authorization-latency risk; no token-revocation/blacklist mechanism beyond refresh rotation.
- **No multi-tenant scoping baked in.** Global-scope unique constraints (`Role.name`, `Permission.code/name`, effectively-global `User.email`) will require a coordinated breaking migration across every identity table to introduce tenancy (documented).
- **Soft-delete correctness is convention-bound.** The partial-unique + `findFirst(deletedAt:null)` pattern is powerful but has no compile-time or test-time guardrail; a single missed filter can leak deleted rows or break uniqueness.
- **Regression exposure from zero tests + heavy conventions.** The architecture leans hard on repeated patterns (cache strategy, transaction+audit, query-key factories). Without tests, refactors and AI-generated changes can silently violate them.
- **Migrate-on-boot deploy coupling.** `pnpm start` runs `db:migrate:prod` then boots — a failed/long migration blocks startup and couples release to schema change; no documented rollback path.
- **Type duplication across boundary.** `packages/types` diverging from Prisma output can produce runtime/contract mismatches the compiler won't catch.

---

## 21. Suggested Priorities

_(Recommendations only — for Founder/Architect decision, not actions taken this sprint.)_

**P0 — Protect what exists**

1. **Commit the uncommitted modules + migrations** (Classroom→Scheduling) so the current product state is versioned and reviewable.
2. **Decide the AI-DOS foundation** this initiative will build (Constitution first, per the stated plan) using the existing `/docs` as source material.

**P1 — Close the highest-leverage gaps** 3. **Reconcile the three permission sources** into one source of truth (or a generated pipeline) to stop RBAC drift. 4. **Introduce a testing standard + first tests** around the riskiest invariants (scheduling idempotency, sessionNumber, enrollment race, soft-delete uniqueness, token rotation), and add a `test` step to CI. 5. **Resolve doc/impl drifts**: response-envelope spec, Swagger tags, BUSINESS.md AI contradiction, README product identity.

**P2 — Prepare for the money/attendance phase** 6. **Write the missing standards/knowledge** an AI-DOS will encode: partial-unique rule, transaction+audit rule, repository-layer rule, error/i18n catalog, domain glossary, ADRs for the deliberate decisions. 7. **Address statefulness before scaling** (move OAuth codes / any session state to Redis) and **document a multi-tenancy plan** ahead of Phase 7.

**P3 — Automation** 8. Scaffolding/generation for the repetitive module pattern; dependency/security scanning in CI; confirm/implement the `PendingDeletion` cleanup job.

---

## 22. Questions

Open questions for the Founder / System Architect before Sprint 1 (Constitution) — answers will shape the AI-DOS:

1. **AI-DOS scope & authority.** The Constitution is described as the "highest authority." Should it _supersede_ `CLAUDE.md` and `/docs`, _incorporate_ them, or _sit above and reference_ them? What happens on conflict between the Constitution and existing docs?
2. **Product identity.** Is the canonical product the **education-center operations SaaS** (BUSINESS/PRD) — treating `apps/web`'s school-news content and the `school-portal` name as legacy/secondary? This affects how the AI frames every future decision.
3. **The "AI" MVP contradiction.** BUSINESS.md lists AI in both Included and Not-Included; PRD says out-of-scope. Is AI in or out of the current MVP?
4. **Uncommitted work.** The Classroom→Scheduling modules and 8 migrations are untracked. Are they intentionally staged, or should committing them be part of foundation work?
5. **Testing posture.** There are zero automated tests. Will the AI-DOS mandate tests as a definition-of-done gate, and if so at what layer(s) and coverage expectation?
6. **Source-of-truth policy.** For permissions/types/validators that currently exist in 2–3 places, does the Architect want a single hand-authored source, a generated pipeline, or status quo for now?
7. **Boundaries for the AI.** What may the Lead Implementation Engineer (me) change autonomously vs. require approval — e.g., docs, tests, non-architectural refactors, migrations? (CLAUDE.md says never redesign architecture without approval; I'd like the same clarity for schema, dependencies, and public API changes.)
8. **Knowledge-base substrate.** Should the future Knowledge Base be authored fresh, or primarily _distilled_ from the existing `/docs` corpus (which is already effectively a KB)?
9. **Language policy.** Domain/code is English; user-facing strings and seed data are Vietnamese, currently hardcoded. Should the AI-DOS require i18n/message-catalog extraction, or preserve inline Vietnamese for now?
10. **Non-functional targets.** Are there concrete targets (scale, tenancy timeline, uptime, security/compliance for minors' PII and payments) the Constitution should encode as hard constraints?

---

_End of PROJECT_ANALYSIS.md — Sprint 0 deliverable. No source or existing documentation was modified. Awaiting review._
