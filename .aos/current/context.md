# Current Context

> **Runtime version: slice-02.v8** — valid only with matching `manifest.md`.
> **Responsibility:** WHICH knowledge must be loaded — the minimal set.

## Load (Implementation, Slice #2)

- `docs/slices/slice-02-payment/IMPLEMENTATION_PLAN.md` — THE work order (incl. cross-review F1/F2 + signed Execution Authorization record)
- `docs/slices/slice-02-payment/TECHNICAL_ANALYSIS.md` — architecture rationale when a task needs it
- `docs/slices/slice-02-payment/REQUIREMENT.md` — BI-1…BI-11 definitions
- Source patterns to copy: `apps/api/src/attendance/` (module + services split + P2002 mechanics), `apps/api/src/enrollments/` (repository + derived-field reads), `apps/api/src/class-sessions/` (no-transaction comment), `database/prisma/seed.ts`, `apps/api/test/invariants/` (harness + fixtures), `apps/admin/src/features/attendance/` (frontend feature shape)
- `docs/DATABASE.md`, `docs/API.md`, `docs/CACHE.md`, `docs/QUERY_KEYS.md` (conventions)

## Intentionally NOT loaded

- docs/AI organization documents; RFC-000; CMS; apps/web; auth internals; upload
