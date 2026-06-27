# CLAUDE.md

## PROJECT DOCUMENTATION

Before implementing new features, consult the relevant documentation in `/docs`.

Priority:

1. BUSINESS.md
2. PRD.md
3. ROADMAP.md

If documentation conflicts, follow the highest priority document.

## THINK FIRST

- Ask ONE clarifying question if requirements are unclear.
- Define what "done" means before coding.
- Never assume business rules.

## KEEP IT SIMPLE

- Write the minimum code needed.
- Prefer modifying existing code over creating new files.
- Avoid unnecessary abstractions, dependencies, or refactoring.

## SURGICAL CHANGES

- Change only files related to the task.
- Report unrelated issues instead of fixing them.

## ARCHITECTURE

- Follow Module → Controller → Service → Repository.
- Organize frontend by feature.
- Keep business logic out of controllers and UI components.

## QUALITY

- Validate all inputs.
- Never expose internal or database errors.
- Use transactions for multi-step database operations.
- Avoid N+1 queries and paginate list endpoints.

## SECURITY

- Protect private endpoints with authentication and authorization.
- Never log passwords, tokens, or secrets.
- Audit critical business actions when applicable.

## BEFORE COMPLETING

- Ensure build, lint, type-check, and tests pass when available.
- Verify the feature works before reporting completion.

## PRINCIPLES

Prioritize:

1. Business Value
2. Simplicity
3. Maintainability
4. Security
5. Performance
