# Testing Guide

How to verify a feature (lifecycle stage 7). The goal is confidence that the feature works and
that nothing existing broke. Use `testing-checklist.md` as the gate.

## Principles

- **Verify behaviour, not intentions.** Exercise the feature the way a user/role would.
- **Test the states, not just the happy path.** Loading, empty, error, success; valid and
  invalid input; authorized and unauthorized access.
- **Protect what already works.** Regression matters as much as the new behaviour.

## How to test

1. Walk every acceptance criterion in the Definition of Done and confirm each.
2. Try the important edge cases: empty, invalid, boundary, duplicate, and concurrent where relevant.
3. Verify permissions from both sides — the allowed role succeeds, the disallowed role is blocked.
4. Check data effects: migrations apply cleanly, soft-delete/audit behave, unrelated data untouched.
5. Run whatever automated tests the project has, plus build / lint / type-check.

## When the project has no automated tests for this area

- Verify manually and **record what you checked**, so Review can trust the result.
- If the lack of automated coverage made this risky or slow, that is a real experience —
  capture it in the Lesson (it may become a Future RFC Proposal). Do not silently accept it,
  and do not unilaterally introduce a new testing framework mid-feature.

## Definition of tested

Behaviour verified against the Definition of Done, states covered, permissions confirmed,
regression checked, gates green, and the verification recorded.
