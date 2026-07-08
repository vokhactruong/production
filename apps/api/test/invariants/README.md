# Business Invariant Tests

These are **Business Invariant Tests** (official name — Founder decision), not generic unit
tests. Each spec encodes a business rule the company depends on — evidence uniqueness, exact
lesson deduction, the completion precondition — and maps **one-to-one** to the Definition of
Done invariant list in `docs/slices/slice-01-attendance/REQUIREMENT.md`. The standing principle
(Founder decision D2): _the framework is a tool; the Business Invariant Tests are the company
asset._ Vitest can be swapped; these invariants cannot.

They run against a **real Postgres database** — three of the six invariants _are_ partial-index
semantics and cannot be faked in-memory — using the **real services** wired by hand with the
real `PrismaService` (`support/fixtures.ts`); no mocking of DB semantics anywhere.

## 1:1 mapping to the DoD invariants

| Test                                       | DoD invariant (REQUIREMENT.md)                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `it-1-attendance-uniqueness.spec.ts`       | 1 — One attendance record per (enrollmentId, sessionId); cannot be created twice         |
| `it-2-no-double-deduction.spec.ts`         | 2 — No double lesson deduction under retry/race (+ Q3 reversal on correction)            |
| `it-3-soft-delete-uniqueness.spec.ts`      | 3 — Soft delete does not break the uniqueness rule (partial-unique convention)           |
| `it-4-session-number-never-reused.spec.ts` | 4 — sessionNumber never reused (regression guard on the consumed invariant)              |
| `it-5-enrollment-active-race.spec.ts`      | 5 — Enrollment race guard holds (one ACTIVE enrollment per student per class)            |
| `it-6-completion-precondition.spec.ts`     | 6 — E1: no COMPLETED transition until attendance is finalized for all ACTIVE enrollments |

## Running locally

1. **Start Postgres** (the repo's compose file):

   ```bash
   docker compose up -d postgres
   ```

2. **Create a dedicated test database** (the suite TRUNCATEs tables between tests and refuses
   to run unless the URL contains `test` — see `support/test-db.ts`):

   ```bash
   docker exec school_portal_db createdb -U postgres school_portal_test
   ```

3. **Apply migrations** to the test database:

   ```bash
   DATABASE_URL=postgresql://postgres:password@localhost:5432/school_portal_test \
   DIRECT_URL=postgresql://postgres:password@localhost:5432/school_portal_test \
   pnpm --filter @school/database db:migrate:prod
   ```

4. **Run the suite**:

   ```bash
   TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/school_portal_test \
   pnpm --filter @school/api test
   ```

CI runs the same sequence in `.github/workflows/ci.yml` (`test` job: `services: postgres:16` →
`db:migrate:prod` → `pnpm --filter @school/api test`).

## House rules

- **Never point `TEST_DATABASE_URL` at a real database.** The safety gate requires the URL to
  contain `test`; `ALLOW_ANY_DB=1` exists but you almost certainly do not want it.
- Tests are deterministic and isolated: every test starts from a truncated database
  (`resetDatabase` in `beforeEach`) and seeds its own fixture graph — never rely on data from
  another test. Files never run in parallel (`fileParallelism: false` in `vitest.config.ts`).
- New invariants (future slices) follow the same pattern: real services via `buildServices`,
  real Postgres, one spec per invariant, mapped 1:1 to the slice's DoD list.
