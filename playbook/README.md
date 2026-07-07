# Engineering Playbook

**POF-001 · Version 1.0 · Status: Foundation**

The Playbook defines **HOW** projects are executed, day to day.
AOS defines **WHY** the organization operates the way it does.

> The Playbook **implements** AOS. It must never redefine AOS.
> If you find something that belongs inside AOS, do not change AOS — record it as a
> **Future RFC Proposal** inside a Lesson (see `templates/lesson-template.md`).

This Playbook is generic. The same process builds School Portal, CRM, ERP, POS, HRM,
Booking, Membership, and future SaaS products. Project-specific rules live in each
project's own documentation (e.g. `/docs`); the Playbook points to them, never copies them.

---

## How to use this Playbook

1. Start any feature at the top of `feature-lifecycle.md`.
2. At each stage, fill the matching **template**, run the matching **checklist**, and follow the matching **guide**.
3. Stop at every stage's exit criteria before moving on.
4. End every feature with **Reflection** and one **Lesson**.

Everything a new engineer or a future AI needs to build a feature correctly is in this
folder **plus the project's own documentation**. Nothing else should be required.

---

## File map

```
playbook/
├─ README.md                      ← you are here (what & how)
├─ feature-lifecycle.md           ← the one lifecycle every feature follows
├─ templates/                     ← fill-in forms (one responsibility each)
│  ├─ requirement-template.md         WHAT & WHY (the ask)
│  ├─ business-analysis-template.md   Should we build it? (value & rules)
│  ├─ technical-analysis-template.md  How does it fit? (architecture & reuse)
│  ├─ implementation-plan-template.md Tasks & Definition of Done
│  └─ lesson-template.md              Reflection output (+ Future RFC Proposal)
├─ checklists/                    ← checkbox gates (prefer over prose)
│  ├─ implementation-checklist.md
│  ├─ review-checklist.md
│  └─ testing-checklist.md
└─ guides/                        ← lightweight how-to
   ├─ implementation-guide.md
   ├─ review-guide.md
   ├─ testing-guide.md
   └─ reflection-guide.md
```

Each stage of the lifecycle maps to exactly one template + one checklist/guide, so there is
no duplication and no ambiguity about which document to use.

---

## Engineering principles

These are inherited from AOS and applied on every feature:

- **Documentation First** — read the project docs before building.
- **Business Before Technology** / **Business Before Code** — value justifies the work.
- **Evidence Before Assumption** — never guess; cite the doc/code, or ask one question.
- **Repository Is The Source Of Truth** — nothing is real until it is committed.
- **One Source Of Truth** — no duplicated definitions of the same fact.
- **Keep It Simple** — no abstraction without a real problem.
- **Prefer Existing Patterns** — reuse before inventing.
- **Prefer Small Iterations** — change only what is necessary.
- **Reusable Knowledge** — write the _why_ down so it outlives the session.
- **Reflection Over Assumption** — learn from what happened, not what we imagined.
- **Framework Evolves From Reality** — AOS changes only through real project experience.

## Playbook principles

- Practical and lightweight.
- Minimizes both AI ambiguity and human ambiguity.
- Every template has a single responsibility.
- No duplicated documentation.
- Checklists over prose. Templates over examples.

---

## Evolution rule

This Playbook is expected to evolve — **but every change must originate from real project
experience.** Never from speculation, preference, or theoretical perfection. The mechanism is
Reflection → Lesson → (optionally) Future RFC Proposal. The Playbook and AOS are never edited
mid-feature and never on a hunch.

## Success criteria

A brand-new engineer, or a future AI, can develop any feature correctly after reading only
**`playbook/` and the project documentation**.
