# Current Context

> **Runtime version: slice-01.v8** — valid only with matching `manifest.md`.
> **Responsibility:** WHICH knowledge must be loaded for this task — the minimal set. Temporary
> state — loaded at Boot Step 4. Prefer the smallest context that lets the AI act correctly.
> List pointers, not copies. Record what is intentionally NOT loaded.

## Load (minimal, on demand)

- Slice artifacts: `docs/slices/slice-01-attendance/IMPLEMENTATION_PLAN.md` (EXECUTION AUTHORIZED — the work order; DoD checklist + Founder decision record + cross-review corrections), REQUIREMENT.md (DoD source)
- Runtime state: all `.aos/current/*` (verify `manifest.md` first — Runtime Contract)
- Implemented source to verify: `apps/api/src/attendance/` (all), `apps/api/src/class-sessions/` (policy seam + E1 hook), `apps/api/src/enrollments/` (derived-balance read), `database/prisma/schema.prisma` + `migrations/20260709000000_add_attendance/`, `database/prisma/seed.ts`, `apps/api/test/invariants/` (+ vitest.config.ts), `.github/workflows/ci.yml`, `apps/admin/src/features/attendance/` + new pages/routes
- Project docs (reference on demand): DATABASE.md, API.md (updated by T24), CONVENTIONS.md
- Playbook stage files: `playbook/checklists/implementation-checklist.md`, `playbook/guides/testing-guide.md`, `playbook/checklists/testing-checklist.md`

## Intentionally NOT loaded

- CMS (articles/categories), `apps/web`, auth internals, upload/Cloudinary
- docs/AI organization documents; RFC-000 (background)
- Full repository scan
