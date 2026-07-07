# Implementation Guide

How to build a feature once its plan is approved (lifecycle stage 5).
This guide is generic; the project's own documentation is the authority on specifics.

## Before you code

1. Re-read the relevant project docs and the approved Implementation Plan.
2. Find the closest existing module/component and copy its shape. **Reuse before inventing.**
3. Confirm the Definition of Done is concrete and testable.

## As you code

- Work task by task, in the planned order. Keep each change small and reviewable.
- Put logic in the layer it belongs to; keep boundaries clean.
- Follow the project's naming, structure, validation, permission, soft-delete, and audit
  conventions exactly — consistency beats cleverness.
- Handle loading, empty, error, and success states for anything user-facing.
- Respect **one source of truth**: never define the same fact (a permission, a type, a
  constant) in two places — reference the existing one.
- Change only what the feature needs. Do not refactor unrelated code, even if tempting.

## When you are unsure

- Do not guess. Find the evidence in the docs/code, or ask **one** clarifying question.
- If the task seems to require a new pattern, a schema/dependency/public-API change, or an
  architecture decision — **stop and escalate**. Those need approval, not initiative.

## Before you hand off

- Run the `implementation-checklist.md` and pass every item.
- Update the project documentation for anything you changed.
- Surface any assumption you had to make so the reviewer can see it.
