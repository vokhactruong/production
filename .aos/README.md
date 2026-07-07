# .aos — AI Boot Loader

**BOOT-001 · Status: Foundation**

This folder is how an AI **starts working**. It defines _how context is loaded_ — nothing more.
It does not define architecture, organization, workflow, or implementation.

- **Architecture / rules** live in AOS (`docs/AI/…`, `docs/AOS/…`).
- **HOW work is done** lives in the Playbook (`playbook/…`).
- **WHO does work** lives in `docs/AI/ORGANIZATION_STRUCTURE.md`.
- **How an AI boots into that work** lives here.

## What is in this folder

```
.aos/
├─ README.md              ← you are here (what this folder is)
├─ boot.md                ← the boot sequence an AI follows to become productive
└─ current/               ← temporary, per-session working state (not persistent knowledge)
   ├─ role.md                 WHO am I this session (which hat)
   ├─ task.md                 WHAT am I working on (feature / module / objective / stage)
   ├─ context.md              WHICH knowledge is loaded (minimal pointers)
   ├─ decisions.md            WHAT is already decided (binding constraints/approvals)
   └─ plan.md                 WHERE we are (current plan + next step)
```

## The one rule to remember

> **Read `boot.md` first. Load only the minimum it tells you to. The repository stays the
> source of truth — never load all of it.**

## Persistent vs. temporary

- **Persistent knowledge** (AOS, Playbook, Organization Structure, project `/docs`) is authored,
  reviewed, and versioned. The boot loader _points to_ it; it does not copy it.
- **Temporary state** (`current/`) describes only _this_ piece of work and is expected to change
  or be cleared at feature boundaries. It is a scratchpad for context, never a source of truth.

Nothing here executes anything. It only tells a starting AI **what to read, in what order, and
when to stop reading.**
