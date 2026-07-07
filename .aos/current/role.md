# Current Role

> **Responsibility:** WHO the AI is this session (the active hat). Temporary state — loaded at
> Boot Step 2. If empty or ambiguous, the AI must stop and ask, not assume a role.
> Authority and boundaries for the role are defined in `docs/AI/ORGANIZATION_STRUCTURE.md` — this
> file only _names_ the active hat and points to that section.

- **Active role (hat):** Chief Architect (advisory) — drafting Technical Analysis. _(Drafted by AI Co-Architect at handoff, 2026-07-07; Founder to confirm.)_
- **Role definition:** `docs/AI/ORGANIZATION_STRUCTURE.md` → §4 "AI · Chief Architect (advisory hat)"
- **Answers to (escalation target):** Founder (business/scope/rules). AI Co-Architect reviews the draft before Founder approval (cross-review rule: no AI reviews its own work).
- **Notes / constraints for this session:** Before starting the analysis, execute the approved P0: commit all untracked work (6 modules + 8 migrations + docs/AI + docs/AOS + playbook + .aos + docs/slices) in logically grouped commits. Then draft `docs/slices/slice-01-attendance/TECHNICAL_ANALYSIS.md` only — no implementation, no schema migration yet.
