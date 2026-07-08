# Technical Analysis — Product Slice #1: Attendance

> **Status: APPROVED FOR IMPLEMENTATION PLANNING — Founder/Chief Architect, 2026-07-07 (9.8/10).**
> All 8 ⚑ decisions approved; adjustments recorded in "Founder decision record" at the end.
> Drafted by: **AI · Chief Architect (advisory hat)**, per `playbook/templates/technical-analysis-template.md`.
> This document **proposes and flags**; it **decides nothing**. Every schema change and every
> architecture decision below is marked **⚑ DECISION (approval required)** and must be approved by
> the Founder/Architect before Implementation (Requirement escalation rule).
> No self-review: this draft goes to the AI Co-Architect before the Founder.
>
> **Binding frame (Founder, 2026-07-07):** business rules are **upstream** of every technical
> option. Nothing here changes an approved business rule; each option is evaluated _against_ them.
> Founder framing carried in: **Attendance is Evidence, not State.**

- **Feature:** Attendance (Product Slice #1)
- **Linked business analysis:** `docs/slices/slice-01-attendance/BUSINESS_ANALYSIS.md` (GO, 2026-07-07)
- **Linked requirement / DoD:** `docs/slices/slice-01-attendance/REQUIREMENT.md` (APPROVED, 2026-07-07)

---

## 1. Summary & the pivotal question

This slice adds an **Attendance** record per `(Enrollment × ClassSession)` and makes lesson
deduction a **consequence** of attendance evidence, fired on **Session → COMPLETED**. The build is
mostly a straight reuse of existing module patterns (controller → service → repository → Prisma,
soft-delete, partial-unique, audit). **Two decisions are non-trivial and are the substance of this
analysis:**

- **⚑ DECISION 1 — Balance representation: derived vs stored.** Today `Enrollment` stores
  `billingCycleSessions` (the lesson cap, snapshotted from `class.sessionCount`,
  `enrollments.service.ts:166`) but has **no consumed/remaining column**. So "remaining lessons"
  does not exist yet and _how_ it exists is an open decision that the Founder's "Evidence, not
  State" framing speaks directly to. This choice reshapes Models A/B/C below.
- **⚑ DECISION 2 — Where deduction lives: Models A / B / C** (Founder-mandated trade-off, §6).

Everything else (data model, API, RBAC, tests) follows once these two are settled.

---

## 2. Affected areas

| Layer   | Area                                                    | Change                                                                                                                      |
| ------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| DB      | `database/prisma/schema.prisma` + new migration         | New `Attendance` model (+ enum). Possibly one `Enrollment` column (depends on ⚑ DECISION 1).                                |
| API     | new `apps/api/src/attendance/` module                   | controller + service + repository + dto, registered in `app.module.ts`.                                                     |
| API     | `apps/api/src/class-sessions/class-sessions.service.ts` | hook the completion precondition (E1) + deduction trigger into the `ONGOING → COMPLETED` transition (`:136-138`, `:15-20`). |
| DB/seed | `database/prisma/seed.ts`                               | new `attendance.*` permission codes; grant to Teacher/Admin/Super Admin (role-scope expansion).                             |
| Admin   | new `apps/admin/src/features/attendance/` + pages       | session attendance screen (roster + statuses + "Mark All Present"), history views.                                          |
| Shared  | `packages/types` (+ admin `constants/permissions.ts`)   | Attendance types + permission constants (mind the existing permission-source drift — PROJECT_ANALYSIS §11).                 |
| CI      | `.github/workflows/ci.yml`                              | add a `test` step (DoD-mandated).                                                                                           |
| Docs    | `DATABASE.md`, `API.md`, `ROADMAP.md`                   | update before Done.                                                                                                         |

---

## 3. Existing patterns to reuse (reuse before inventing)

- **Module shape:** copy `enrollments/` or `class-sessions/` (controller/service/repository/dto,
  `select`-projection record types, `{ items, meta }` list envelope).
- **Soft-delete + partial-unique:** the `deletedAt: null` lookup discipline and partial-unique
  index convention (DATABASE.md; e.g. `Enrollment` one-active rule) apply directly to the
  Attendance uniqueness rule (§5).
- **Audit pairing:** `auditLogs.log({ action, entity, entityId, metadata })` on every write, with
  before/after `metadata` exactly as `class-sessions.service.ts:155-179` and
  `enrollments.service.ts:224-246`.
- **Status-transition guard:** the `ALLOWED_TRANSITIONS` table pattern
  (`class-sessions.service.ts:15-20`) is the model for attendance status handling and for gating
  session completion.
- **Code/RBAC seeding:** `seed.ts` `PERMISSIONS_SEED` + `ROLE_PERMISSIONS` upsert pattern.
- **Frontend:** feature folder with `api/` + `hooks/` (query-key factory), Pattern A/B cache rules
  (CACHE.md), `<Can>` gating + `PermissionRoute`.

**Reuse verdict:** no new _framework_ is needed. The only genuinely new design is _how deduction
flows_ (§6) — everything else is a known pattern.

---

## 4. Business rules → technical obligations (traceability)

| Approved business rule (source)                                                                        | Technical obligation                                                                                                          |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Attendance per (Enrollment × ClassSession); roster = ACTIVE enrollments of the session's class (DoD)   | `Attendance` FKs `enrollmentId` + `classSessionId`; roster query = active enrollments by `classId`.                           |
| Idempotent recording — update never duplicate (DoD)                                                    | Partial-unique `(enrollmentId, classSessionId) WHERE deletedAt IS NULL`; upsert on that key.                                  |
| PRESENT/LATE/ABSENT deduct; EXCUSED does not — **default Org Policy, configurable later** (Q1/Q5)      | Deducting-status set must be a **named policy value**, not a hardcoded literal scattered in code (§6, §12).                   |
| Deduction fires on Session → COMPLETED, never on marking; never for cancelled/rescheduled (Q3)         | Deduction "counts" only when `ClassSession.status = COMPLETED`; hook at the completion transition, not at attendance write.   |
| Deduct exactly once; reverse on correction to non-deducting (DoD)                                      | Guaranteed by construction if balance is **derived** (⚑ DECISION 1); if **stored**, needs careful once-only + reversal logic. |
| Attendance stored on its own table, never on ClassSession (BUSINESS.md participation layer)            | Separate `Attendance` table; nothing added to `ClassSession`.                                                                 |
| Inactive students cannot receive attendance (PRD)                                                      | Reuse `assertActiveStudent`-style guard via enrollment→student status.                                                        |
| Completion blocked until attendance finalized for all ACTIVE enrollments (E1, service-layer invariant) | Precondition check in `ClassSessionsService.update` before `ONGOING → COMPLETED` (§7).                                        |
| 48h teacher-editable, then Admin/Manager; corrections only, never delete; audited (Q4)                 | Time-window check on update path + permission tier; soft-delete not exposed for correction; audit every write.                |
| Teachers get `attendance.read/create/update` (Q2)                                                      | New permission codes + Teacher role grant (§9).                                                                               |

---

## 5. Data model impact

**New `Attendance` model (required, ⚑ DECISION — schema change needs approval):**

Fields (proposed): `id`, `enrollmentId` (FK), `classSessionId` (FK), `status` (enum
`AttendanceStatus { PRESENT, LATE, ABSENT, EXCUSED }`), `note?`, `markedById?` (actor),
`deletedAt?`, `createdAt`, `updatedAt`. Indexes on both FKs + `status`; **partial-unique
`(enrollmentId, classSessionId) WHERE deletedAt IS NULL`** (same convention as
`Enrollment`/`Classroom`, expressed in raw migration SQL, not the Prisma DSL).

- **Teacher/Classroom/Student never duplicated onto Attendance** — derived via
  `Enrollment`/`ClassSession`, consistent with the "never store derivable data" rule (DATABASE.md).
- Attendance is soft-deletable in principle, but per Q4 the _product_ never deletes — corrections
  only. Soft-delete stays for convention/uniqueness reuse, not as a user action.

**`Enrollment` change — conditional on ⚑ DECISION 1:**

- **If derived balance (recommended, §6):** **no `Enrollment` column added.**
  `remaining = billingCycleSessions − COUNT(deducting attendance on COMPLETED sessions)`.
- **If stored balance:** add `consumedLessons Int @default(0)` (compute remaining =
  `billingCycleSessions − consumedLessons`); requires once-only + reversal maintenance.

---

## 6. ⚑ DECISION 2 — The deduction trade-off: Models A / B / C

Founder mandate: analyze exactly three, no default, criterion = _simplest design that keeps
deduction replaceable when Makeup/Holiday/Voucher/Credit arrive_ ("Simple before clever";
"No abstraction without repeated evidence").

**Shared hidden assumption to expose first:** all three models are phrased as
"Attendance → … → **Enrollment**", which presumes deduction is a **write** to Enrollment. The
Founder's own framing — _Attendance is Evidence, not State_ — questions that. If the balance is
**derived** (⚑ DECISION 1), there is **no write to Enrollment at all**: deduction is a computed
read (`COUNT` of deducting attendance on COMPLETED sessions). This dissolves the hardest problems
(double-deduction, reversal, multi-row atomicity) _by construction_. So each model is evaluated in
both representations.

|                                                  | **Model A — direct CRUD** (attendance write mutates Enrollment)                                                                                                                     | **Model B — event-driven** (attendance → event → Enrollment)             | **Model C — business service** (AttendanceService owns deduction)                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Business-rule fidelity**                       | OK, but "fire on COMPLETED not on marking" is awkward — the write happens at marking; needs deferral logic.                                                                         | OK; events can carry the COMPLETED trigger.                              | OK; the service applies the COMPLETED-trigger rule in one place.                             |
| **Replaceability (Makeup/Voucher/Credit)**       | Poor — deduction logic smeared across attendance write paths.                                                                                                                       | Best — new consumers subscribe to events.                                | Good — one seam; new rules extend the service.                                               |
| **Simplicity now**                               | Highest to write, lowest to keep correct.                                                                                                                                           | Lowest — needs an event store/dispatch the codebase does **not** have.   | Moderate — one more service, a pattern the codebase already uses everywhere.                 |
| **Reuse of existing patterns**                   | High (plain CRUD) but fights the trigger rule.                                                                                                                                      | Low — new infrastructure.                                                | Highest — services owning cross-module logic is the house style (e.g. `SchedulingService`).  |
| **Transaction-reliability constraint (see §10)** | Worst — mutating N enrollment counters atomically on completion runs straight into the documented pgbouncer interactive-transaction incident (`class-sessions.service.ts:140-145`). | Adds async/eventual-consistency reasoning on top of the same constraint. | Manageable — and if paired with **derived balance**, needs **no multi-row mutation at all**. |
| **Idempotency / reversal**                       | Manual and bug-prone (guard against double-count; reverse on correction).                                                                                                           | Manual (event de-dup, compensation).                                     | Trivial **if derived**; manual if stored.                                                    |
| **Test surface (DoD invariants)**                | Large (once-only, reversal, race).                                                                                                                                                  | Largest (event delivery + ordering).                                     | Smallest **if derived** (COUNT is deterministic).                                            |

**Advisory recommendation (not a decision):** **Model C + derived balance.**

- The **service (C)** is the single replaceable seam the Founder asked for — Makeup/Holiday/Voucher
  later extend `AttendanceService` (or, when a _second_ consumer actually exists, C emits events and
  evolves into B; that is the point at which B's abstraction earns its cost — "no abstraction
  without repeated evidence"). Adopting **B now** is premature: there is no second consumer yet and
  no event infrastructure in the repo.
- **Derived balance** makes "deduct exactly once" and "reverse on correction" _true by
  construction_, and — critically — sidesteps the documented transaction-reliability problem (§10)
  because completing a session performs **no multi-row counter mutation**.
- **Model A** is the thing to avoid: simplest to type, but it re-imports every correctness hazard
  the Founder's "Evidence not State" framing exists to prevent, and collides with §10.

**This recommendation is advisory. ⚑ Founder/Architect must decide** (a) derived vs stored, and
(b) A/B/C. If a stored counter is later wanted for read performance, it can be added as a
_materialized cache_ of the derived truth ("measure first") — not as the source of truth.

---

## 7. Deduction trigger & completion precondition (E1)

Both hook the **`ONGOING → COMPLETED`** transition in `ClassSessionsService.update`
(`class-sessions.service.ts:136-138`), which is the only path that sets COMPLETED
(`ALLOWED_TRANSITIONS`, `:15-20`):

1. **Precondition (E1, binding invariant):** before allowing COMPLETED, assert every **ACTIVE**
   enrollment of the session's class has a **finalized** attendance record for this session. Else
   `BadRequestException` (service-layer, test-covered — not UI-only). UX: "Mark All Present" makes
   finalization a 2-tap action.
2. **Deduction:** with **derived** balance, _no action runs here_ — the session simply being
   COMPLETED is what makes its deducting attendance rows count. With **stored** balance, this is
   where the once-only counter update would fire (and where §10 bites).

**Cross-module note:** this couples `class-sessions` → attendance/enrollment. Proposed:
`ClassSessionsService` calls `AttendanceService.assertFinalizedForSession(classSessionId)` (Model
C seam). ⚑ This cross-module call is an architecture decision — flagged for approval.

---

## 8. API / interface impact

- **New:** `GET /attendance?classSessionId=…|classId=…|studentId=…` (paginated, envelope
  `{ items, meta }`); `POST /attendance/sessions/:sessionId` to record/upsert a session's roster
  (idempotent bulk upsert); `PATCH /attendance/:id` for single correction. No breaking changes to
  existing endpoints.
- **Completion** stays `PATCH /class-sessions/:id` with `status: COMPLETED` — the precondition just
  makes it conditionally reject. No new "complete" verb (RPC-style avoided, API.md).
- **Derived balance read:** expose remaining on the enrollment detail/roster response as a computed
  field — additive, no contract break.
- ⚑ The bulk-record shape (`POST /attendance/sessions/:sessionId`) is a mild deviation from pure
  REST resource style — flagged for Architect confirmation (justified by the <10s teacher KPI:
  one round-trip for the whole roster).

---

## 9. Permissions / security

- **New codes:** `attendance.read`, `attendance.create`, `attendance.update` (naming matches
  `class_session.*` style). Seed in `PERMISSIONS_SEED`; grant to **Super Admin, Admin** (all) and
  **Teacher** (`read/create/update`) — the first operational Teacher grant (role-scope expansion,
  Business Analysis).
- **48h window + tier:** service checks `now − session.date/createdAt ≤ 48h` for Teacher-origin
  edits; beyond that require Admin/Manager permission. ⚑ Confirm whether a distinct
  `attendance.correct` (Admin/Manager) code is wanted vs reusing `attendance.update` + a role check
  — flagged (naming/authorization-granularity decision).
- **One-source-of-truth caution:** add the codes to the seed **and** admin `constants/permissions.ts`;
  do **not** revive the stale `packages/constants` enum drift (PROJECT_ANALYSIS §11) — pick the live
  source. (Wider fix is EP-02, out of this slice.)
- Inactive-student guard reused; no secrets/PII logged (attendance is minors' behavioral data —
  Business Analysis risk; retention model out of scope, noted for Parent Portal).

---

## 10. ⚑ Transaction & concurrency strategy (documented constraint)

**Evidence of an internal inconsistency the deduction design must resolve:**
`enrollments.service.ts` uses `prisma.$transaction(async (tx) => …)` freely, while
`class-sessions.service.ts:140-145` **deliberately avoids interactive transactions**, citing a
production _"Transaction not found"_ incident under pgbouncer transaction-pooling. Deduction is
exactly the kind of _multi-row, money-adjacent_ operation that would want a transaction — so this
constraint is central, not incidental.

- **Derived balance (recommended)** largely **removes the need**: recording a roster is N
  independent idempotent upserts; completion mutates no counters. Atomicity requirements drop to
  "each upsert is atomic" (trivially true).
- **Idempotency** comes from the partial-unique key + upsert, not from a transaction.
- **If stored balance** is chosen instead, the once-only counter update on completion needs a safe
  atomic strategy under the pgbouncer constraint — ⚑ a real architecture decision (e.g. a single
  `UPDATE … SET consumedLessons = … WHERE …` guarded by a derived recount, avoiding interactive
  transactions).

⚑ **Decision flagged:** the transaction strategy for completion/deduction, and whether to
reconcile the two modules' differing transaction stances, is for the Architect.

---

## 11. Invariant tests (DoD-mandated; CI gains a `test` step)

Map each DoD invariant to a test seam (framework choice is an Architect decision — none exists yet;
this slice introduces the first tests + CI `test` step):

- One attendance per `(enrollmentId, classSessionId)` — insert-twice rejected (partial-unique).
- No double deduction under retry/race — with derived balance, a `COUNT`-based property test; with
  stored, a concurrency test.
- Soft-delete does not break uniqueness (partial-unique convention).
- `sessionNumber` never reused — regression guard (consumes existing invariant).
- Enrollment one-ACTIVE race guard holds (existing rule, regression).
- **E1 completion precondition** — COMPLETED rejected while any ACTIVE enrollment is unmarked.

⚑ Test framework + CI wiring is a small standards decision (ties to EP-03 from FRR-001) — flagged.

---

## 12. Technical risks

- **Representation lock-in:** choosing stored-counter now and deriving later (or vice-versa) is a
  migration; DECISION 1 should be made deliberately, not defaulted. (Recommendation: derived.)
- **Policy hardcoding:** the deducting-status set must be a named, per-organization-configurable
  policy value from day one (Q1) — the risk is scattering `status === 'ABSENT'` literals. Contain it
  behind one policy accessor even in this slice.
- **pgbouncer transaction hazard** (§10) — real, production-proven; derived balance is the
  low-risk path around it.
- **Permission-source drift** (§9) — easy to re-introduce; keep to the live source.
- **Teacher <10s KPI** is a launch gate (Business Analysis) — the bulk-roster endpoint + optimistic
  UI matter; a chatty per-student API would miss it.

---

## 13. Architecture decisions requiring approval (consolidated — none decided here)

1. ⚑ **New `Attendance` table + migration** (schema change; escalation rule).
2. ⚑ **DECISION 1 — balance derived vs stored** (→ whether `Enrollment` gets a column).
3. ⚑ **DECISION 2 — Model A/B/C** for deduction (advisory: **C + derived**).
4. ⚑ **Cross-module call** `ClassSessionsService → AttendanceService` for E1 (§7).
5. ⚑ **Transaction strategy** for completion/deduction under the pgbouncer constraint (§10).
6. ⚑ **Bulk-record endpoint** shape `POST /attendance/sessions/:sessionId` (§8).
7. ⚑ **Permission granularity** — `attendance.correct` vs role-checked `attendance.update` (§9).
8. ⚑ **Test framework + CI `test` step** introduction (§11).

---

## 14. Open questions / escalations

- **Makeup/Holiday interaction:** derived-balance replaceability assumes Makeup later _adds_
  crediting logic in the service; confirm no Makeup semantics are needed _now_ (Requirement says
  out of scope — assumed, please confirm).
- **"Finalized" definition for E1:** does an `EXCUSED` mark count as "finalized" (yes, it is a
  recorded status)? Assumed yes; confirm.
- **Rescheduled sessions:** Q3 says rescheduled never deduct; a rescheduled session that later
  becomes COMPLETED _would_ deduct under derived rules — confirm "rescheduled" is represented as a
  status that never reaches COMPLETED, or clarify.

---

## 15. Out of scope (reaffirmed)

Notifications, QR/mobile, makeup/leave workflow, teacher attendance/payroll, AI, analytics
dashboard (Requirement §Out of scope). This analysis adds no capability beyond recording +
derived deduction + history.

---

_End of Technical Analysis (DRAFT). Advisory only — proposes and flags; decides nothing. Next:
AI Co-Architect cross-review → Founder approval of the ⚑ decisions → Implementation Plan
(`playbook/templates/implementation-plan-template.md`). No schema, migration, or code written in
this stage._

---

## Cross-review — AI Co-Architect (2026-07-07)

**Verdict: APPROVE with comments.** Citations spot-verified against source (pgbouncer incident
comment at `class-sessions.service.ts:140-145`; `billingCycleSessions` at `schema.prisma:503`,
`enrollments.service.ts:166`) — the evidence is real, not asserted.

**Concur with the recommendation (Model C + derived balance).** Exposing the hidden assumption in
the A/B/C framing — that all three presuppose a _write_ to Enrollment — is the most valuable
insight in this document. Derived balance is "Attendance is Evidence, not State" taken to its
logical conclusion: the balance _is a query over evidence_. It makes two DoD invariants
(once-only, reversal) true by construction and routes around a production-proven transaction
hazard. C-then-B-when-a-second-consumer-exists is exactly "no abstraction without repeated evidence."

**Review comments (for the Implementation Plan, none blocking):**

1. **Derived-balance read path must be aggregate, not N+1.** Roster/list views computing
   `COUNT` per enrollment must use one grouped query; a per-row count would threaten the <10s KPI
   on large classes. Add to Implementation Plan as an explicit task.
2. **§14 "rescheduled" — proposed interpretation for Founder confirmation:** CANCELLED sessions
   never deduct (never reach COMPLETED). A _rescheduled_ session (date edited) still eventually
   completes and **should** deduct — the lesson happened, just later. "Rescheduled never deducts"
   should mean "rescheduling by itself triggers nothing," not "a moved session is free."
3. **§9 permission granularity — recommend the separate `attendance.correct` code** granted to
   Admin/Manager for the post-48h path. For money-adjacent corrections, an explicit permission is
   auditable RBAC configuration; a role-name check inside service code is a hidden rule.
4. **Mid-cycle enrollment (deferred, note for Slice #2):** a student enrolling after N sessions
   completed has no attendance rows for those sessions; derived balance handles it cleanly, but
   _what they owe_ is a Payment-slice business question. Record in the slice's LESSON.md so
   Payment inherits it as a known question, not a surprise.
5. **E1 "finalized" = any recorded status including EXCUSED** — concur with the assumption; a
   recorded EXCUSED is finalized evidence. Founder to confirm alongside the ⚑ list.

**Process note:** this review satisfies the cross-review rule (drafting AI ≠ reviewing AI).
Approval authority for the 8 ⚑ decisions remains with the Founder.

---

## Founder decision record (2026-07-07) — all ⚑ decisions APPROVED, with adjustments

1. **Derived Balance = Source of Truth.** Official architecture decision — and the **default
   architecture for all similar capabilities company-wide** going forward. No counters, no
   dual-source sync, no rollback/double-deduction class of bugs.
2. **Model C, with concept separation.** Attendance creates Evidence; Lesson Consumption is a
   Business Rule — two responsibilities, named accordingly: `AttendanceApplicationService`
   (evidence) calling **`LessonConsumptionService`** (accounting rule). Same module for now —
   the _concepts_ are separated, not the deployment. Names reflect business, not database.
3. **Cross-module interaction via Business Policy (Dependency Inversion).** Session completion
   does not know Attendance. `ClassSession.complete()` → Attendance Policy → Lesson Accounting.
   Claude CLI to analyze whether an interface or application service keeps the dependency clean.
4. **Bulk endpoint** — approved as proposed.
5. **Transaction strategy** — approved; derived balance removes the interactive-transaction need.
6. **`attendance.correct`** — approved as a distinct permission; no role checks in service code.
7. **Testing renamed: "Business Invariant Tests"** — that is what the company needs, not
   coverage-driven unit tests.
8. Attendance is recognized as the first **Business Capability: Participation Management** —
   future reuse targets: HRM employee attendance, Booking check-in, CRM event attendance.

**Mandatory additions to IMPLEMENTATION_PLAN.md (Founder directive):**

1. **Business Timeline** (not a state machine): Scheduled → Ongoing → Attendance Recording →
   Attendance Finalized → Session Completed → Lesson Consumed. Include a short timeline diagram.
2. **Known Constraints**: recorded-not-solved items deliberately deferred to Slice #2 — e.g.
   _Payment must define how to calculate remaining lessons for students joining mid-cycle._
3. **Business Capability Mapping** (document opener): which capability this slice realizes, so
   CRM/HRM/Booking can identify and reuse it.

**Standing principle (Founder, company-wide):** an Implementation Plan is not a plan to write
code — it is a plan to realize a Business Capability.
