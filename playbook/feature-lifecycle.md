# Feature Lifecycle

Every feature — in any project — follows exactly this lifecycle. Do not skip stages.
Right-size the effort to the risk, but pass through every gate.

```
Requirement
   ↓
Business Analysis
   ↓
Technical Analysis
   ↓
Implementation Plan
   ↓
Implementation
   ↓
Review
   ↓
Testing
   ↓
Reflection
   ↓
Lessons Learned
   ↓
Done
```

Each stage has one input, one artifact, and a clear exit condition. You may not enter a
stage until the previous stage's exit condition is met.

| #   | Stage                   | Owner                                         | Use                                                                         | Exit condition                                                                          |
| --- | ----------------------- | --------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | **Requirement**         | Requester + Engineer                          | `templates/requirement-template.md`                                         | The WHAT and WHY are stated in business terms, with a definition of done.               |
| 2   | **Business Analysis**   | Founder / Business owner (Engineer drafts)    | `templates/business-analysis-template.md`                                   | The feature passes the value test and is approved to proceed, or is dropped.            |
| 3   | **Technical Analysis**  | Architect (Engineer drafts)                   | `templates/technical-analysis-template.md`                                  | The technical approach reuses existing patterns; any architecture decision is approved. |
| 4   | **Implementation Plan** | Engineer                                      | `templates/implementation-plan-template.md`                                 | Tasks, sequence, and Definition of Done are agreed.                                     |
| 5   | **Implementation**      | Engineer (AI as Lead Implementation Engineer) | `guides/implementation-guide.md` + `checklists/implementation-checklist.md` | Code follows the plan and conventions; implementation checklist passes.                 |
| 6   | **Review**              | Reviewer / Architect                          | `guides/review-guide.md` + `checklists/review-checklist.md`                 | Work meets business, architecture, and quality bars; review checklist passes.           |
| 7   | **Testing**             | Engineer / Reviewer                           | `guides/testing-guide.md` + `checklists/testing-checklist.md`               | Behaviour is verified; quality gates pass; existing functionality intact.               |
| 8   | **Reflection**          | Engineer                                      | `guides/reflection-guide.md`                                                | The one Reflection question (below) has been answered.                                  |
| 9   | **Lessons Learned**     | Engineer                                      | `templates/lesson-template.md`                                              | A Lesson is recorded (even if "nothing to change").                                     |
| 10  | **Done**                | Owner (Founder/Architect for release)         | —                                                                           | Feature meets its Definition of Done and is released per project process.               |

---

## The Reflection gate

At **Reflection**, ask **only one** question:

> **"Did we learn something that should improve every future project?"**

- **NO** → record the Lesson and **close the feature**. Do not touch the Playbook or AOS.
- **YES** → record the Lesson **and** a **Future RFC Proposal** inside the Lesson
  (`templates/lesson-template.md`). Then close the feature.

**Never update AOS directly. Never edit the Playbook mid-feature.** Improvements to the
organization flow through the RFC process, driven by recorded, real experience — not by
assumption. A YES produces a _proposal_, not a change.

---

## Rules for the whole lifecycle

- **Evidence before assumption.** If a stage is blocked by an unknown, ask one clarifying
  question or record it as an open question — do not guess.
- **Escalate, don't decide.** Anything reserved to the Founder (business/scope) or Architect
  (architecture/rules) is escalated, not decided inside a stage.
- **Small and local.** Change only what the feature requires. Do not refactor unrelated work.
- **Documentation first and last.** Read the project docs at Analysis; update them before Done.
