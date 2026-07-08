# Implementation Plan — Product Slice #1: Attendance

> **Status: APPROVED — EXECUTION AUTHORIZED (Founder/Chief Architect, 2026-07-07).**
> D1–D5 are **FROZEN** as the **Implementation Contract** (see Founder decision record at end).
> No runtime (CLI/Extension/agents) may change them — discovering a needed change means
> **escalate, never self-modify**. A **Scope Gate** applies at every phase: _"Is this task solving
> the current slice's problem?"_ — if not, escalate (e.g. mid-cycle → Payment, not Attendance).
> Per `playbook/templates/implementation-plan-template.md`, extended with the three mandatory
> Founder sections (Business Capability Mapping, Business Timeline, Known Constraints).
> This plan realizes a **Business Capability**, not merely code (Founder standing principle).
> It **proposes and sequences; it decides nothing new** — all architecture below is already
> approved (`TECHNICAL_ANALYSIS.md` "Founder decision record", `.aos/current/decisions.md`).
> Anything genuinely new is marked **⚑ DECISION (approval required)**.

- **Feature:** Attendance (Product Slice #1)
- **Linked technical analysis:** `docs/slices/slice-01-attendance/TECHNICAL_ANALYSIS.md` (APPROVED 2026-07-07, 9.8/10)
- **Linked requirement / DoD:** `docs/slices/slice-01-attendance/REQUIREMENT.md` (APPROVED 2026-07-07)
- **Planned by:** AI — Engineering Manager + Implementation Engineer hats

---

## Business Capability Mapping (Founder directive — document opener)

This slice realizes the company's first named **Business Capability: Participation Management** —
recording _who participated in a scheduled event_ as evidence, and deriving business consequences
(here: lesson consumption) from that evidence.

| Aspect           | This slice's realization                      | Future reuse of the capability                      |
| ---------------- | --------------------------------------------- | --------------------------------------------------- |
| Evidence record  | Attendance per (Enrollment × ClassSession)    | **HRM** — employee attendance per shift             |
| Consequence rule | `LessonConsumptionService` (deduction policy) | **Booking** — check-in consumes a reservation       |
| Derived balance  | remaining = cap − COUNT(consumed evidence)    | **CRM** — event attendance feeds engagement scoring |

Design implications honored throughout this plan: evidence is a generic, consequence-free record
(never stores derivable data); the consequence rule is a **named, separately-owned service** so a
future capability swaps the rule, not the recording; the balance is **a query over evidence**
(Derived Balance = Source of Truth, company-wide default).

## Business Timeline (Founder directive)

This is a **business timeline** — the story of one session — **not a state machine** (the only
technical state machine remains `ALLOWED_TRANSITIONS` in `class-sessions.service.ts:15-20`).

```
 Scheduled ──▶ Ongoing ──▶ Attendance ──▶ Attendance ──▶ Session ──▶ Lesson
 (PLANNED)    (teacher      Recording      Finalized      Completed    Consumed
               in class)   (roster marked, (every ACTIVE  (business    (derived: deducting
                            <10s, "Mark    enrollment has event; E1    rows now COUNT
                            All Present")  a status —     gate passed) against the balance —
                                           EXCUSED counts)             no write occurs)
```

Key business readings of the timeline:

- **Attendance Recording precedes Session Completed** — E1: completion is _blocked_ until the
  roster is finalized for all ACTIVE enrollments (EXCUSED is a finalized status).
- **Lesson Consumed is a consequence, not an action** — nothing "runs" at completion to deduct;
  the session _being_ COMPLETED is what makes its deducting attendance rows count in the derived
  balance. CANCELLED sessions never reach COMPLETED and therefore never consume.
- **Rescheduling moves the timeline; it does not exit it** — a moved session that eventually
  COMPLETEs still consumes; rescheduling itself triggers nothing (decisions.md).

## Known Constraints (recorded, not solved — deferred to Slice #2)

- **Mid-cycle enrollment vs. remaining lessons:** a student enrolling after N sessions have
  COMPLETED has no attendance rows for those sessions; derived balance handles the _count_
  cleanly, but **Payment (Slice #2) must define how to calculate remaining lessons for students
  joining mid-cycle** (what they owe / what their cap means). Recorded here and to be carried
  into this slice's LESSON.md so Payment inherits it as a known question, not a surprise
  (cross-review comment #4).
- **Per-organization deduction policy:** PRESENT/LATE/ABSENT deduct, EXCUSED does not — shipped
  as the _default_ Organization Policy behind one named value; the per-organization configuration
  surface is a later slice.
- **Minors' PII retention/consent model** — out of scope; must exist before Parent Portal exposes
  attendance externally (BUSINESS_ANALYSIS risk).

---

## Binding architecture (approved — restated for the implementer, not re-litigated)

1. **Derived Balance is Source of Truth.** `remaining = Enrollment.billingCycleSessions −
COUNT(Attendance rows with deducting status whose ClassSession.status = COMPLETED)`. No stored
   counter, no new `Enrollment` column. (`billingCycleSessions` exists: `schema.prisma:503`,
   snapshotted in `enrollments.service.ts:166`.)
2. **Model C with concept separation:** `AttendanceApplicationService` (evidence recording) calls
   `LessonConsumptionService` (business rule: which statuses deduct). Same NestJS module,
   separated concepts; names reflect business.
3. **Deduction policy is one named value** — `DEDUCTING_STATUSES` (PRESENT, LATE, ABSENT) owned by
   `LessonConsumptionService`; never scattered `status === "ABSENT"` literals.
4. **Dependency Inversion at completion:** `ClassSessionsService` must not import attendance
   internals; it calls a completion-policy seam (⚑ D1 below proposes the mechanism).
5. **E1 invariant (service layer + test):** ONGOING → COMPLETED rejected until every ACTIVE
   enrollment of the session's class has a recorded status for that session (EXCUSED = finalized).
6. **API surface (fixed):** `POST /attendance/sessions/:sessionId` (idempotent bulk roster
   upsert), `GET /attendance` (paginated `{ items, meta }`), `PATCH /attendance/:id` (correction).
7. **Permissions:** `attendance.read/create/update` → Teacher + Admin + Super Admin;
   `attendance.correct` → Admin-tier only (post-48h). Seed + `apps/admin/src/constants/permissions.ts`;
   the stale `packages/constants` enum is not touched (EP-02 owns that drift).
8. **48h correction window** enforced in the service; corrections only, never deletes, every write
   audited with before/after metadata (pattern: `class-sessions.service.ts:155-179`).
9. **No interactive transactions on the completion path** (pgbouncer "Transaction not found"
   incident — comment at `class-sessions.service.ts:140-145`). Derived balance removes the need.
10. **Attendance table:** `id` cuid, `enrollmentId` FK, `classSessionId` FK, `status`
    enum `AttendanceStatus { PRESENT, LATE, ABSENT, EXCUSED }`, `note?`, `markedById?`,
    `deletedAt?`, `createdAt`, `updatedAt`; **partial-unique `(enrollmentId, classSessionId)
WHERE "deletedAt" IS NULL` in raw migration SQL** (house convention, cf. migration
    `20260705000000_add_enrollment`); never stores teacher/classroom/student.
11. **Read path is aggregate** — one grouped COUNT query, never N+1 (explicit task T8).
12. **Business Invariant Tests** (official name) map one-to-one to the REQUIREMENT.md DoD list;
    CI gains a `test` step. Framework proposed, not installed (⚑ D2).

---

## Tasks (in order)

Verification legend: **B** = `pnpm build` · **L** = `pnpm lint` · **T** = `pnpm type-check` ·
**IT** = invariant test (once T13 lands) · **M** = manual/dev-DB check.

### Phase 1 — Database & migration

1. [ ] **Add `AttendanceStatus` enum + `Attendance` model to `database/prisma/schema.prisma`.**
       Fields exactly per binding item 10; relations to `Enrollment`, `ClassSession`, and `User`
       (`markedBy`); indexes on `enrollmentId`, `classSessionId`, `status`, `deletedAt`;
       `@@map("attendances")`. Include the house doc-comment explaining that the uniqueness rule is a
       partial index living in raw SQL (pattern: `Enrollment` model comment, `schema.prisma:496-500`).
       ⚑ D5 fixes the `markedById` FK target. _Verify:_ `pnpm db:generate` succeeds; T.
2. [ ] **Create migration `2026MMDD000000_add_attendance`** — new table + enum + FKs + indexes,
       and the **raw SQL partial-unique** `CREATE UNIQUE INDEX ... ON "attendances"("enrollmentId",
"classSessionId") WHERE "deletedAt" IS NULL;` with a business-rule comment block (pattern:
       `database/prisma/migrations/20260705000000_add_enrollment/migration.sql`, the
       `enrollments_active_student_class_key` index). Existing migrations are immutable — new folder
       only. _Verify:_ `pnpm db:migrate` on dev DB; M: insert same (enrollmentId, classSessionId)
       twice → unique violation; soft-delete first row → re-insert succeeds.

### Phase 2 — Backend attendance module (`apps/api/src/attendance/`)

3. [ ] **Module skeleton:** `attendance.module.ts`, `attendance.controller.ts`,
       `attendance-application.service.ts`, `lesson-consumption.service.ts`,
       `attendance.repository.ts`, `dto/attendance.dto.ts`; register in `app.module.ts` (pattern:
       `EnrollmentsModule`, `app.module.ts:22,49`). Controller uses `AuthGuard` +
       `@RequirePermissions` + `@CurrentUser` exactly as `enrollments.controller.ts`. Repository uses
       `select`-projection record types (pattern: `enrollments.repository.ts`). _Verify:_ B, L, T.
4. [ ] **`LessonConsumptionService`** — owns the policy and the derived balance:
       `DEDUCTING_STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT"]` as the single named
       policy value (documented as default Org Policy, configurable per organization later);
       `getConsumedByEnrollmentIds(ids)` — **one** `groupBy`/aggregate COUNT over attendance rows with
       deducting status joined to `ClassSession.status = COMPLETED`, `deletedAt: null`;
       `remainingFor(enrollment, consumed)`. No writes anywhere in this service. _Verify:_ T; IT-2.
5. [ ] **`POST /attendance/sessions/:sessionId` — idempotent bulk roster upsert**
       (`AttendanceApplicationService.recordSession`). Steps: load session (`deletedAt: null`, 404
       otherwise); assert session status is recordable (⚑ D4); load roster = ACTIVE enrollments of
       `session.classId`; reject payload rows whose `enrollmentId` is not in the roster or whose
       student is inactive (PRD rule — guard via enrollment→student status, pattern:
       `enrollments.service.ts` active-student check); per row, `upsert` on the partial-unique key
       (idempotency comes from the key, not a transaction — **no `$transaction`**, N independent
       atomic upserts, §10 of the analysis); audit each create/update via `auditLogs.log` with
       before/after `metadata` (pattern: `class-sessions.service.ts:155-179`), `entity: "Attendance"`.
       Response: the session's attendance rows. _Verify:_ B, T; IT-1, IT-2; M: re-POST same payload →
       updates, never duplicates.
6. [ ] **`GET /attendance` list** — filters `classSessionId | classId | studentId | status`,
       pagination + `{ items, meta }` envelope, `deletedAt: null` discipline, `sortBy/sortOrder`
       (pattern: `class-sessions.service.ts:71-106` findAll). `classId`/`studentId` filter via the
       `enrollment` relation — no denormalized columns. `@RequirePermissions("attendance.read")`.
       _Verify:_ B, T; M: envelope shape matches existing lists.
7. [ ] **`PATCH /attendance/:id` correction** — status/note only; never a delete path. Window
       check in the service: within 48h (anchor: ⚑ D3) → `attendance.update` suffices; beyond 48h →
       require `attendance.correct` (checked as a permission, **no role-name checks in service
       code** — decisions.md). Correction to a non-deducting status needs no reversal logic: the
       derived COUNT simply no longer includes the row (reversal true by construction). Audit with
       before/after metadata. _Verify:_ B, T; IT-2; M: post-48h edit without `attendance.correct` → 403.
8. [ ] **Aggregate derived-balance read exposure (explicit task — cross-review #1).** Expose
       computed `remaining` (and `consumed`) on the enrollment list/detail responses and on the
       session-roster read used by the UI, by batching all visible enrollmentIds through
       `LessonConsumptionService.getConsumedByEnrollmentIds` — **one grouped query per request, never
       a COUNT per row**. Additive field; no contract break (touches `enrollments.service.ts`
       read path only). _Verify:_ B, T; M: inspect query log — exactly one aggregate query for a
       15-student roster.

### Phase 3 — Completion-hook integration (E1 + consumption trigger)

9. [ ] **Completion-policy seam (⚑ D1) + E1 enforcement.** Define `SessionCompletionPolicy`
       (interface + Nest injection token, per D1 proposal) — e.g.
       `assertSessionCompletable(classSessionId): Promise<void>`; implement it in the attendance
       module (`AttendanceApplicationService` or a thin provider) as: every ACTIVE enrollment of the
       session's class has a non-deleted attendance row for this session (**any recorded status,
       including EXCUSED, is finalized**); throw `BadRequestException` listing how many are unmarked
       otherwise. Inject the token into `ClassSessionsService` and call it inside `update()` when
       `dto.status === "COMPLETED"`, immediately after `assertValidTransition`
       (`class-sessions.service.ts:136-138`). `ClassSessionsService` imports only the
       token/interface — never attendance internals. **No consumption code runs at completion**
       (derived balance) and **no `$transaction`** — the existing no-transaction comment
       (`:140-145`) stays authoritative. _Verify:_ B, T; IT-6; M: complete a session with one
       unmarked ACTIVE enrollment → 400; mark all (one EXCUSED) → completes.

### Phase 4 — Seed & permissions

10. [ ] **`database/prisma/seed.ts`:** add to `PERMISSIONS_SEED` — `attendance.read`,
        `attendance.create`, `attendance.update`, `attendance.correct` (name/description style of
        `class_session.*` entries, `seed.ts:63-75`). Add to `ROLE_PERMISSIONS`: Super Admin + Admin →
        all four; **Teacher → read/create/update** (first operational Teacher grant — Q2).
        `attendance.correct` goes to Super Admin + Admin only (the seed has no "Manager" role — see
        Inconsistencies note). Upsert pattern untouched — seed stays idempotent. _Verify:_
        `pnpm db:seed` twice on dev DB (idempotent); M: Teacher login sees attendance, cannot correct
        post-48h.
11. [ ] **`apps/admin/src/constants/permissions.ts`:** add `ATTENDANCE_READ/CREATE/UPDATE/CORRECT`
        constants (pattern: `ENROLLMENT_*`, `CLASS_SESSION_*` at `:50-58`). **Do not touch the stale
        `packages/constants` enum** (PROJECT_ANALYSIS §11 drift; wider fix is EP-02). _Verify:_ L, T.

### Phase 5 — Business Invariant Tests + CI

12. [ ] **⚑ D2 — introduce the test runner (proposal: Vitest; nothing installed by this plan).**
        On approval: add dev-deps to `apps/api` (`vitest`, `unplugin-swc`, `@swc/core` — needed for
        Nest decorator metadata under Vitest), `vitest.config.ts`, `"test"` script, root
        `turbo` test pipeline entry. Tests live in `apps/api/test/invariants/` and run against a real
        Postgres (partial-unique behavior cannot be faked in-memory), configured via `TEST_DATABASE_URL`
    - `prisma migrate deploy`. _Verify:_ `pnpm --filter @school/api test` runs an empty suite.
13. [ ] **IT-1 — uniqueness:** one attendance per `(enrollmentId, classSessionId)` — creating
        twice via the bulk endpoint/service updates instead of duplicating; direct double-insert at
        the DB rejects (partial-unique). _(DoD invariant 1.)_
14. [ ] **IT-2 — no double deduction under retry/race:** fire the bulk upsert for the same roster
        concurrently/repeatedly; complete the session; derived COUNT per enrollment is exactly 1 per
        deducting row; correcting PRESENT → EXCUSED lowers the count (reversal by construction).
        _(DoD invariants 2 + Q3 reversal.)_
15. [ ] **IT-3 — soft delete does not break uniqueness:** soft-delete a row, re-create for the
        same key succeeds; two live rows never coexist. _(DoD invariant 3.)_
16. [ ] **IT-4 — `sessionNumber` never reused** (regression guard on the consumed invariant;
        cf. `schema.prisma:457-463` and migration `20260707000000_class_session_number_never_reused`).
        _(DoD invariant 4.)_
17. [ ] **IT-5 — enrollment one-ACTIVE race guard holds** (regression; partial index
        `enrollments_active_student_class_key`). _(DoD invariant 5.)_
18. [ ] **IT-6 — E1 completion precondition:** ONGOING → COMPLETED rejected while any ACTIVE
        enrollment is unmarked; EXCUSED counts as finalized; CANCELLED sessions' attendance (if any)
        never counts in the balance; a date-moved session that later COMPLETEs does count. _(DoD
        invariant 6 + rescheduling rule.)_
19. [ ] **CI:** add a `test` step to `.github/workflows/ci.yml` after `type-check`/`build`
        (currently lint → type-check → build only, `ci.yml:48-50`), with a `services: postgres`
        container + `prisma migrate deploy` against it (part of ⚑ D2). _Verify:_ CI green on a PR.

### Phase 6 — Admin frontend (`apps/admin`)

20. [ ] **Feature scaffold `src/features/attendance/`:** `api/attendance.api.ts` (three calls
        mirroring the API surface; pattern: `features/enrollments/api/enrollments.api.ts`),
        `hooks/query-keys.ts` (factory pattern: `features/enrollments/hooks/query-keys.ts`, rules per
        `docs/QUERY_KEYS.md`), hooks `use-session-attendance`, `use-record-attendance`,
        `use-correct-attendance`, `use-attendance-list` (mutation + invalidation per `docs/CACHE.md`
        Pattern A/B; attendance mutations also invalidate enrollment keys because `remaining` is
        derived). _Verify:_ L, T.
21. [ ] **Session attendance screen** (roster + statuses + **"Mark All Present"** shortcut —
        approved UX for E1): reached from the session context (class detail / sessions list,
        pattern: `pages/class-sessions/`); renders ACTIVE-enrollment roster with current statuses,
        tap-to-cycle or segmented status control, one **bulk save** (single `POST` round-trip — <10s
        KPI), then offers "Complete session". Handles loading/empty/error states; surfaces the E1
        400 message when completion is rejected. `<Can>` gating with `ATTENDANCE_*` constants
        (pattern: existing pages, e.g. `pages/Enrollments.tsx`). _Verify:_ B, L, T; M: full
        teacher flow ≤ 10s on a 15-student roster.
22. [ ] **History + balance views:** attendance history filterable by session / class / student
        (list page over `GET /attendance`, envelope-driven pagination like existing lists); show
        derived `remaining` on enrollment list/detail (from task 8's field — display only, no client
        math). Post-48h rows render correction affordance only for holders of `attendance.correct`.
        _Verify:_ B, L, T; M states: loading/empty/error all render.
23. [ ] **Routing:** lazy routes + `PermissionRoute` registration in `App.tsx` (pattern:
        `class-sessions/:id/edit` at `App.tsx:423`). _Verify:_ B; M: direct URL access without
        permission is blocked.

### Phase 7 — Documentation updates

24. [ ] **`docs/DATABASE.md`:** Attendance model, the partial-unique convention instance, the
        **Derived Balance rule** (no counter columns — company-wide default), never-store-derivable
        note (no teacher/classroom/student on attendance). **`docs/API.md`:** the three endpoints,
        envelope, permission codes, 48h/`attendance.correct` semantics, E1 rejection behavior of
        `PATCH /class-sessions/:id`. **`docs/ROADMAP.md`:** Phase 2 attendance status update.
        _Verify:_ docs review against implemented behavior; L (prettier).

### Phase 8 — Final verification & close

25. [ ] **Full gates:** `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm --filter @school/api
test` all pass; seed idempotency re-checked; manual regression of untouched flows
        (enrollments CRUD, session generate/sync, session cancel). Walk the DoD checklist below
        item-by-item. Record Reflection + LESSON.md (mandatory at slice close — REQUIREMENT
        constraint), including the mid-cycle Known Constraint handoff to Slice #2 and the Slice
        Success Metrics assessment (Product KPIs, REQUIREMENT.md).

## Sequence & dependencies

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
            T4 → T8                     (balance read needs the policy service)
      T5, T4 → T9                       (E1 needs recorded evidence + module seam)
T3 → T10 → T11                          (codes exist before UI constants)
T12 → T13..T18 → T19                    (runner before tests before CI step)
T2, T9 → T13..T18                       (tests exercise migration + completion hook)
T6, T8, T10, T11 → T20 → T21 → T22 → T23 (frontend after API + permissions)
T9, T19, T23 → T24 → T25
```

Migrations before code; schema (T1–T2) is the root dependency. ⚑ approvals needed before their
tasks start: D1 → T9; D2 → T12/T19; D3 → T7; D4 → T5; D5 → T1.

## Data / migration steps

- **One new migration** (T2): `attendances` table + `AttendanceStatus` enum + FKs
  (`ON DELETE RESTRICT ON UPDATE CASCADE`, house style) + indexes + **raw-SQL partial-unique**
  with business-rule comment. Existing migrations are immutable — nothing edited.
- **No `Enrollment` column, no backfill** — derived balance means historical correctness is a
  query, not a data migration.
- **Seed change** (T10) is additive and idempotent (upsert pattern unchanged).
- Rescheduling needs no data handling: it edits `date` only; consumption keys off
  `status = COMPLETED` alone.

## Test plan

**Business Invariant Tests** (official name — Founder decision 7) are the core: T13–T18 map
one-to-one to the six DoD invariants in REQUIREMENT.md (see each task's _(DoD invariant n)_ tag).
They run against real Postgres because three of them _are_ partial-index semantics.

Beyond invariants, verify per `playbook/**/testing-checklist.md`:

- **States:** loading/empty/error on every new screen (T21/T22); envelope pagination.
- **Permission paths:** Teacher (read/create/update, no correct), Admin (all), role without
  `attendance.read` (blocked route + 403), post-48h boundary both sides (T7).
- **Edge cases:** roster with 0 ACTIVE enrollments (completion trivially allowed — no roster to
  finalize); inactive student rejected; payload enrollment not in roster rejected; CANCELLED
  session recording rejected (⚑ D4); date-moved session completes and consumes.
- **Regression:** enrollments CRUD, session generate/sync, session delete rules — untouched
  modules must behave identically (T25).

## Rollout / rollback

- **Ship order = phase order**; the feature is inert until the frontend lands (new endpoints are
  permission-gated; E1 hook only affects the ONGOING → COMPLETED action).
- **Riskiest change:** the E1 gate alters existing completion behavior. It ships in the same
  release as the recording UI + "Mark All Present" so teachers are never blocked without the tool
  to unblock themselves.
- **Rollback:** revert the app release (hook + endpoints disappear). The `attendances` table is
  additive and can stay through a rollback (forward-only migrations, house convention); evidence
  already recorded is preserved. No counter to un-wind — derived balance makes rollback
  data-safe by construction.

## Review needs

- **Architecture review:** T9 seam (⚑ D1) and the migration SQL (T2) — schema changes require
  Architect approval before implementation (escalation rule).
- **Business review:** Founder sign-off on ⚑ D3/D4 (they touch business rules' edges), and on the
  Business Timeline reading above.
- **Engineering review:** cross-review of the module against `enrollments/` conventions;
  no-transaction discipline on the completion path.
- **Quality review:** Business Invariant Tests coverage vs DoD list (1:1, no gaps).
- **Release review:** CI `test` step green + gates in T25.

## Definition of Done

Restates `REQUIREMENT.md` §Definition of Done (authoritative source) as the exit checklist:

- [ ] Attendance recorded per (Enrollment × ClassSession); roster = ACTIVE enrollments of the session's class (T5).
- [ ] Idempotent recording — re-submission updates, never duplicates (T5, IT-1).
- [ ] Deduction tied to Session → COMPLETED only; exactly once per deducting status; reversed on correction to non-deducting — by derived construction (T4, T7, IT-2).
- [ ] Attendance on its own table referencing Enrollment + ClassSession; nothing on ClassSession (T1/T2).
- [ ] Inactive students cannot receive attendance (T5).
- [ ] RBAC: `attendance.read/create/update/correct` seeded and enforced; Teacher operational grant live (T10/T11).
- [ ] All six Business Invariant Tests exist and pass (T13–T18), including E1 service-layer test (IT-6).
- [ ] Build, lint, type-check pass; CI has a `test` step running the invariant tests (T19, T25).
- [ ] Docs updated: DATABASE.md, API.md, ROADMAP.md Phase 2 (T24).
- [ ] Engineering gates: implementation/review/testing checklists passed; existing functionality intact (T25).
- [ ] `.aos` Reflection + LESSON.md written; Known Constraints handed to Slice #2; Product KPIs assessed (T25).

## Open questions — ⚑ DECISIONS (approval required; nothing below is decided)

- **⚑ D1 — Completion-seam mechanism (analysis mandated by Founder decision 3).**
  _Option 1 — interface + injection token:_ `class-sessions` declares
  `SessionCompletionPolicy` (interface) + `SESSION_COMPLETION_POLICY` (token); the attendance
  module provides the implementation; `ClassSessionsService` injects the token. Completion knows
  only "a policy must pass" — it never names Attendance; a future capability (or a no-op in
  tests) swaps the provider. Cost: one token + one interface file.
  _Option 2 — inject `AttendanceApplicationService` directly:_ fewer moving parts, but
  `ClassSessionsModule` then imports `AttendanceModule` and completion _knows Attendance_ —
  exactly what Founder decision 3 ("Session completion does not know Attendance") rules out, and
  it inverts the dependency direction only nominally.
  **Proposal: Option 1** — it is the literal implementation of the approved Dependency
  Inversion wording, at the cost of ~20 lines.
- **⚑ D2 — Test framework + CI wiring (Founder decision 7 asked for a proposal).** The repo has
  **no test framework anywhere** (only `@nestjs/testing` utilities, `apps/api/package.json:44`;
  scripts are dev/build/lint/type-check only). **Proposal: Vitest** + `unplugin-swc` (for Nest
  decorator metadata) — TS-native, zero Babel config, fits the pnpm/turbo/ESLint-10 toolchain,
  one runner reusable by the admin app later. Alternative: Jest + `ts-jest` (NestJS's documented
  default; heavier config, slower, but maximum Nest-docs alignment). CI: GitHub Actions
  `services: postgres` container + `prisma migrate deploy` + `pnpm --filter @school/api test`.
  Nothing installed until approved.
- **⚑ D3 — 48h window anchor.** Q4 says "editable for 48 hours" without an anchor. **Proposal:**
  window = 48h from the **session's end datetime** (`session.date` + `endTime`) — ties the
  correction right to the lesson event, not to when the row happened to be created (a row created
  late would otherwise extend its own window). Alternative: `attendance.createdAt`.
- **⚑ D4 — Which session statuses accept attendance writes.** REQUIREMENT's desired-outcome
  wording ("any COMPLETED-or-today ClassSession") predates E1 (recording must _precede_
  completion) and doesn't map cleanly to the status machine. **Proposal:** bulk recording allowed
  for **ONGOING** sessions and (as correction context) **COMPLETED** ones; **PLANNED** rejected
  (session hasn't started; prevents pre-marking) and **CANCELLED** always rejected. Corrections
  via `PATCH /attendance/:id` follow the 48h/`attendance.correct` rules regardless of status.
- **⚑ D5 — `markedById` FK target (schema detail not fixed in the approved field list).**
  **Proposal:** nullable FK → `users.id`, `ON DELETE RESTRICT` (house style), same actor
  semantics as `AuditLog.userId`. Nullable because system/seed writes may lack an actor.

### Accommodations of doc-vs-code drift (recorded, no action in this slice)

- **"Admin/Manager" for post-48h corrections:** no "Manager" role exists in `ROLES_SEED`
  (`seed.ts:82-89`). Plan grants `attendance.correct` to Super Admin + Admin; a future Manager
  role receives it via RBAC configuration, not code.
- **`packages/types` (TECHNICAL_ANALYSIS §2):** the live frontend pattern defines request/response
  typing locally per feature (`features/enrollments/api/enrollments.api.ts` uses the shared `api`
  client, not `@school/types`). The plan follows the live pattern; shared-types consolidation
  stays with EP-02.
- **Transaction-stance split:** `enrollments.service.ts` uses interactive `$transaction` while
  `class-sessions.service.ts:140-145` bans it. Per the approved decision, everything on the
  attendance/completion path is transaction-free; reconciling the two modules is out of scope.

---

_End of Implementation Plan (DRAFT). Next: Founder/Architect approval of ⚑ D1–D5 → Implementation.
No code, schema, or migration is written by this document._

---

## Cross-review — AI Co-Architect (2026-07-07)

**Verdict: APPROVE with two corrections (both incorporated as binding notes for Implementation).**

**Correction 1 — T5's "upsert" mechanics are imprecise (real defect if implemented literally).**
The partial-unique key lives in raw SQL only, **not** in the Prisma DSL (binding item 10) — so
`prisma.attendance.upsert()` cannot target it (Prisma upsert requires a DSL-declared unique).
The house pattern is `findFirst({ deletedAt: null }) → create/update`, which is **not atomic**:
two concurrent creates race, the loser hits `P2002` from the partial index. Implementation must
catch `P2002` and convert it to a re-read + update (the existing 5-retry P2002 pattern in
`employees.service.ts` code generation is the reference). IT-2's concurrency case must assert
exactly this path. Idempotency still comes from the DB index — the note is about the _client
mechanism_, not the design.

**Correction 2 — ⚑ D4 needs one more edge closed: no new rows on COMPLETED sessions.**
As proposed, bulk-recording on a COMPLETED session uses the _current_ ACTIVE roster — so a
mid-cycle enrollee (joined after the session completed) could receive a brand-new attendance row
on a past session, which **instantly consumes a lesson** via the derived count. That silently
front-runs the mid-cycle question explicitly deferred to Slice #2 (Known Constraints).
Sharpened proposal for D4: **ONGOING → create + update; COMPLETED → update existing rows only
(corrections), never create; PLANNED/CANCELLED → rejected.** Backfilling attendance onto
completed sessions becomes a deliberate future decision, not an accident.

**Concur on the rest:** D1 Option 1 (the token is the literal reading of the approved Dependency
Inversion), D2 Vitest (repo has no runner; Vitest fits the toolchain — Jest alternative noted),
D3 session-end anchor (ties the right to the lesson event, prevents self-extending windows),
D5 nullable FK → users.id. Phase ordering, dependency graph, rollout risk call (E1 ships with
"Mark All Present"), and the 1:1 invariant-test mapping all check out against the approved docs.

**Process note:** drafted by Implementation-Planning agent; reviewed by AI Co-Architect
(cross-review rule). Founder holds approval on D1–D5.

---

## Founder decision record (2026-07-07) — D1–D5 APPROVED and FROZEN (Implementation Contract)

- **D1 — Option 1: interface + injection token.** Official naming: **Business Policy Interface**
  (not merely "completion interface") — completion may later compose multiple policies
  (Attendance, Safety, Payment Hold, …). Session Completion never knows Attendance.
- **D2 — Vitest** (+ unplugin-swc, CI postgres service). Standing principle: _the framework is a
  tool; the Business Invariant Tests are the company asset._
- **D3 — 48h anchor = session end datetime** (`session.date` + `endTime`). Business Rule, not a
  technical default.
- **D4 — Writable-status matrix (official):** PLANNED ❌create ❌update · ONGOING ✅create ✅update ·
  COMPLETED ❌create ✅update · CANCELLED ❌create ❌update. Protects the Slice #1/#2 boundary
  (mid-cycle backfill is deliberately impossible).
- **D5 — `markedById` → `users.id`, nullable, ON DELETE RESTRICT.**
- **Cross-review corrections ratified:** the P2002 findFirst→create/update mechanism (Prisma
  upsert cannot target the raw-SQL partial-unique) and the COMPLETED-no-create rule are part of
  the contract.
- **Freeze rule:** from this point, D1–D5 and the binding architecture are an **Implementation
  Contract**. Any runtime discovering a needed change: **stop → escalate → wait**. Never self-modify.
- **Scope Gate (new, Founder):** at every phase the runtime asks _"does this task solve the
  current slice's problem?"_ If no → escalate.
- **Process evolution (recorded for the Reflection Meeting → RFC):** from Slice #2, the lifecycle
  gains an explicit **Execution Authorization** stage between Implementation Plan and
  Implementation — the company's formal "design has ended, execute the plan" button, signed by
  Founder + Chief Architect.
