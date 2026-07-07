# Review Guide

How to review a feature (lifecycle stage 6). Review protects the organization's bars; it does
not redesign the work. Use `review-checklist.md` as the gate.

## What review is for

A reviewer confirms the change is **valuable, consistent, correct, safe, and documented** —
and escalates anything that is actually a decision, rather than deciding it in review.

## Angles to check (match to the change)

- **Business** — does it deliver the approved value and stay in scope?
- **Architecture** — does it follow existing patterns? Any new pattern approved?
- **Engineering** — quality, simplicity, reuse, small/local change, self-explanatory code.
- **Security & data** — server-side permissions, no leaked secrets/errors, soft-delete/audit,
  sound migrations that are backward compatible.
- **AI-produced work** — evidence-backed, no overreach beyond authority, assumptions surfaced.
- **Quality** — build/lint/type-check pass, testing checklist passed, docs updated.

## How to give the outcome

- **Approve** when all bars are met.
- **Request changes** with specific, evidence-based reasons — point to the doc/convention.
- **Escalate** when the change implies a business, architecture, or authority decision. Do not
  approve around it and do not decide it yourself.

## Reviewer discipline

- Judge against written rules, not personal preference.
- Prefer the smallest correct change; do not ask for unrelated rework.
- If a rule and the code disagree, the code is the defect — unless the rule itself is wrong,
  which is a Reflection/RFC matter, not a review edit.
