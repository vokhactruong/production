# Review Checklist

> Run during **Review** (lifecycle stage 6). The reviewer checks the work against the bars
> below. Anything reserved to the Architect/Founder is escalated, not decided in review.

## Business alignment

- [ ] Solves the stated requirement and its business value.
- [ ] Stays within the agreed scope (no scope creep).
- [ ] Matches the roadmap priority it was approved under.

## Architecture & consistency

- [ ] Follows existing patterns; no unapproved new pattern or redesign.
- [ ] Correct layering; business logic in the right place.
- [ ] Reuses existing components; no duplication.
- [ ] Any new pattern/architecture decision was approved by the Architect.

## Code quality

- [ ] Simple, readable, self-explanatory; comments explain _why_, not _what_.
- [ ] No dead code, magic values, or unused variables.
- [ ] Change is small and local.

## Security & data integrity

- [ ] Permissions enforced server-side.
- [ ] No secrets/tokens exposed or logged; internal errors not leaked to users.
- [ ] Soft delete / audit applied where required.
- [ ] Data model changes are sound (constraints, indexes, migrations, backward compatible).

## AI-produced work (when applicable)

- [ ] Claims/decisions are backed by evidence, not assumption.
- [ ] No overreach beyond authorized boundaries (schema/dependencies/public API/architecture).
- [ ] Assumptions and open questions were surfaced.

## Gates

- [ ] Build / lint / type-check pass.
- [ ] Testing checklist passed.
- [ ] Documentation updated.
- [ ] Decision: ☐ Approve ☐ Request changes ☐ Escalate
