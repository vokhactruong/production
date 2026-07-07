# AI Boot Sequence

**BOOT-001 · Status: Foundation**

This file defines how a newly started AI session becomes productive. Follow the six steps in
order. Load only what each step names. When the steps are done, you are **READY**.

> This is a _loading_ procedure, not a workflow. It does not tell you how to do the work
> (Playbook) or what authority you hold (Organization Structure) — it tells you what context to
> pull into the session so you can begin.

```
Step 1  Identify Project
   ↓
Step 2  Identify Role
   ↓
Step 3  Load Current Task
   ↓
Step 4  Load Current Context
   ↓
Step 5  Load Active Decisions
   ↓
Step 6  Load Current Plan
   ↓
READY
```

---

## Boot principles

Apply these throughout the sequence:

- **Load only what is necessary.** Read the slice a step names, not more.
- **Never load the entire repository.** The repository is the source of truth; you _reference_
  it, you do not ingest it.
- **Current context is temporary.** `current/` describes only this work and may change.
- **Organization knowledge is persistent.** AOS, Playbook, Organization Structure are authored
  and versioned; point to them, do not copy them.
- **Business knowledge is read only when required.** Project `/docs` are pulled on demand by the
  task, not preloaded.
- **Reflection updates Lessons; Lessons may propose RFCs; RFCs never apply automatically.**
  Learning flows out through the Playbook's Reflection, never as a live edit to AOS or the Playbook.

---

## The context tiers (what "minimal" means)

Load from the top down, and stop as soon as you have enough for the current step:

| Tier                          | Source                                                                            | When loaded                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **0 — Boot**                  | `.aos/boot.md` (this file)                                                        | Always, first.                                                        |
| **1 — Role knowledge**        | The active role's section of `docs/AI/ORGANIZATION_STRUCTURE.md`                  | Step 2 — only _your_ role, not all roles.                             |
| **2 — Current state**         | `.aos/current/*`                                                                  | Steps 3–6 — the temporary working state.                              |
| **3 — Business/project docs** | project `/docs` (e.g. BUSINESS, PRD, DATABASE, API…) and the Playbook stage files | On demand, named by `current/context.md` — never preloaded wholesale. |
| **4 — Source code**           | specific modules/files the task touches                                           | Only when the task requires, and only the touched area.               |

---

## Step 1 — Identify Project

Determine which project this session serves (this repository, or another that uses AOS).
Confirm the project's documentation root exists (e.g. `/docs`). Do **not** read it yet.
_Output:_ you know the project and where its knowledge lives.

## Step 2 — Identify Role

Read `.aos/current/role.md` to learn which **hat** you are wearing (Engineering Manager,
Implementation Engineer, Reviewer, QA Assistant, Knowledge Curator, …). Then load **only that
role's section** of `docs/AI/ORGANIZATION_STRUCTURE.md` to know your mission, authority (usually
"none to decide"), constraints, boundaries (MUST NOT), and who you escalate to.
_Output:_ you know who you are and what you may/may not do. If `role.md` is empty or ambiguous,
**stop and ask** — do not assume a role.

## Step 3 — Load Current Task

Read `.aos/current/task.md` to learn the current **feature**, **module**, **objective**, and
**lifecycle stage**. The stage tells you which Playbook template/checklist/guide will apply — but
do not begin work here; you are still loading.
_Output:_ you know what is being worked on and how far along it is.

## Step 4 — Load Current Context

Read `.aos/current/context.md` — the **minimal list of documents** required for this task
(pointers into `/docs`, the Playbook, or specific source areas). Load exactly those, on demand.
Note what is intentionally **not** loaded. Prefer the smallest context that lets you act
correctly.
_Output:_ the minimum knowledge for this task is in context; nothing more.

## Step 5 — Load Active Decisions

Read `.aos/current/decisions.md` — the **binding decisions and constraints** already in effect
for this task (approved technical approach, escalation answers, scope boundaries, non-goals).
These are given; do not re-litigate or re-derive them.
_Output:_ you know what is already settled and must be respected.

## Step 6 — Load Current Plan

Read `.aos/current/plan.md` — the **current plan and next step**. This orients you to where the
work stands and what comes next.
_Output:_ you know the immediate next action within the approved plan.

---

## READY

After Step 6 you know: **who you are, what you are doing, the minimal context, the binding
decisions, and the current plan** — without loading the whole repository. You may now act within
your role and the Playbook.

If any step left a required slot empty, ambiguous, or contradictory, you are **not READY** —
raise one clarifying question and wait, rather than proceeding on assumption.

---

## Note on `current/` at feature boundaries

`current/` is temporary. When a feature reaches Done, its `current/` state is expected to be
cleared or replaced for the next task, and any learning is captured through the Playbook's
Reflection → Lesson (which may record a Future RFC Proposal). The boot loader neither performs
nor triggers that — it only relies on `current/` being accurate at boot.
