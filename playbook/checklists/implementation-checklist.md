# Implementation Checklist

> Run during and at the end of **Implementation** (lifecycle stage 5).
> All boxes must be checked (or justified as N/A) before Review.

## Before writing code

- [ ] Read the relevant project documentation for this area.
- [ ] Reviewed similar existing modules/components.
- [ ] Confirmed what to reuse (patterns, shared components) before creating anything new.
- [ ] Implementation Plan and Definition of Done are clear.

## While writing code

- [ ] Followed the project's layering (business logic only where it belongs).
- [ ] Followed naming, structure, and file conventions of the project.
- [ ] Reused existing components/utilities instead of duplicating.
- [ ] No unnecessary abstractions introduced.
- [ ] Changed only what the feature requires — no unrelated refactors.
- [ ] Inputs validated (per project rules), on every boundary that needs it.
- [ ] Authorization/permissions enforced on the server side, not just the UI.
- [ ] User-facing states handled: loading, empty, error, success.
- [ ] Business history preserved where required (soft delete / audit on critical actions).
- [ ] No secrets, passwords, or tokens logged or committed.
- [ ] No stray debug logging left in.
- [ ] One source of truth respected — no duplicated definition of the same fact.

## Before handing to Review

- [ ] Build passes.
- [ ] Lint passes.
- [ ] Type-check passes.
- [ ] Existing functionality still works (nothing obviously broken).
- [ ] Project documentation updated for anything changed.
- [ ] Open questions/assumptions surfaced (not silently assumed).
