# Testing Checklist

> Run during **Testing** (lifecycle stage 7). Verify behaviour and protect existing work.
> Use the automated tests the project provides; where none exist, verify manually and record
> what was checked. (If the absence of automated coverage caused pain, note it in the Lesson.)

## Functional

- [ ] Meets every acceptance criterion in the Definition of Done.
- [ ] Happy path works end to end.
- [ ] Key edge cases handled (empty, invalid, boundary, duplicate, concurrent where relevant).

## States (for any user-facing change)

- [ ] Loading state.
- [ ] Empty state.
- [ ] Error state (friendly message; no raw/internal error shown).
- [ ] Success state.

## Validation & permissions

- [ ] Validation works on the boundaries it should (and rejects bad input).
- [ ] Authorized roles can perform the action; unauthorized roles cannot (verified, not assumed).

## Data

- [ ] Migrations apply cleanly; no data loss.
- [ ] Soft delete / audit behave as intended.
- [ ] No unintended change to unrelated data.

## Regression & gates

- [ ] Existing functionality still works.
- [ ] Automated tests run and pass (if present).
- [ ] Build / lint / type-check pass.

## Record

- [ ] What was tested and how is noted (so Review can trust it).
