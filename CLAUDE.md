# CLAUDE.md

# Project Rules

## PROJECT DOCUMENTATION

Before implementing any feature, read the relevant documentation in `/docs`.

### Product (Highest Priority)

1. BUSINESS.md
2. PRD.md
3. ROADMAP.md

### Engineering

- CONVENTIONS.md

### Backend

- BACKEND.md
- DATABASE.md
- API.md

### Frontend

- FRONTEND.md
- CACHE.md
- QUERY_KEYS.md

If documents conflict, follow this order:

BUSINESS → PRD → ROADMAP → CONVENTIONS → Technical Documents

## BEFORE CODING

- Ask ONE clarifying question if requirements are unclear.
- Review similar existing modules before creating new ones.
- Reuse existing architecture and shared components.
- Define what "done" means before writing code.

## DEVELOPMENT PRINCIPLES

- Keep solutions simple.
- Change only what is necessary.
- Do not refactor unrelated modules.
- Avoid unnecessary abstractions.
- Follow existing project conventions.

## ARCHITECTURE

Backend

Module → Controller → Service → Repository → Prisma

Frontend

Feature → API → Hooks → Components → Pages

Business logic must never exist inside controllers or UI components.

## QUALITY

Always:

- Validate inputs.
- Handle loading, empty, and error states.
- Never expose internal errors.
- Keep code consistent with existing modules.

Before completion:

- Build passes.
- Lint passes.
- Type check passes.
- Existing functionality remains intact.

## SECURITY

- Protect private endpoints with authentication and authorization.
- Never log passwords, tokens, or secrets.
- Audit critical business actions when applicable.

## PRINCIPLES

Prioritize in this order:

1. Business Value
2. Simplicity
3. Consistency
4. Maintainability
5. Security
6. Performance

## AI RULES

- Follow existing project patterns before introducing new ones.
- Never duplicate code when an existing implementation can be reused.
