# Current Context

> **Responsibility:** WHICH knowledge must be loaded for this task — the minimal set. Temporary
> state — loaded at Boot Step 4. Prefer the smallest context that lets the AI act correctly.
> List pointers, not copies. Record what is intentionally NOT loaded.

## Load (minimal, on demand)

- Slice artifacts: `docs/slices/slice-01-attendance/REQUIREMENT.md` (APPROVED), `docs/slices/slice-01-attendance/BUSINESS_ANALYSIS.md` (GO)
- Project docs: BUSINESS.md (Scheduling Engine + Class Workflow sections), DATABASE.md (partial-unique + soft-delete conventions; ClassSession/Enrollment models), API.md (envelope, module boundaries), CONVENTIONS.md (transaction + audit pattern, repository layer)
- Playbook stage file(s): `playbook/templates/technical-analysis-template.md`
- Source areas: `database/prisma/schema.prisma` (ClassSession, Enrollment, Class), `apps/api/src/scheduling/`, `apps/api/src/class-sessions/`, `apps/api/src/enrollments/`, `database/prisma/seed.ts` (permission seeding pattern), one repository-pattern module as reference (e.g. `apps/api/src/employees/`)

## Intentionally NOT loaded

- CMS (articles/categories), `apps/web`, auth internals, upload/Cloudinary
- docs/AI organization documents (background only — not needed for this stage)
- Full repository scan
