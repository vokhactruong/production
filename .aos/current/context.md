# Current Context

> **Runtime version: slice-02.v4** — valid only with matching `manifest.md`.
> **Responsibility:** WHICH knowledge must be loaded — the minimal set.

## Load (Technical Analysis, Slice #2)

- `docs/slices/slice-02-payment/REQUIREMENT.md` + `BUSINESS_ANALYSIS.md` (both APPROVED — the business law)
- `docs/slices/slice-01-attendance/TECHNICAL_ANALYSIS.md` (Reference Slice — format + evidence benchmark, incl. Founder decision record)
- `playbook/templates/technical-analysis-template.md`
- Source (evidence base): `database/prisma/schema.prisma` (Enrollment incl. billingCycleSessions, Attendance, ClassSession), `apps/api/src/attendance/` (lesson-consumption service — the consumption read API), `apps/api/src/enrollments/` (snapshot pattern, module shape), `apps/api/src/class-sessions/` (policy seam + no-transaction comment), `database/prisma/seed.ts`, `apps/api/test/invariants/` (test patterns)
- `docs/DATABASE.md` (Derived Balance + corrected Transactions), `docs/API.md` (envelope + attendance section)

## Intentionally NOT loaded

- Admin frontend beyond what TA needs for flow feasibility (screens are Implementation-Plan detail)
- CMS, apps/web, auth internals, upload
- docs/AI organization documents; RFC-000
