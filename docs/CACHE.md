# CACHE.md

## Purpose

This document defines the caching strategy for the frontend.

All TanStack Query hooks must follow these rules.

---

# Query Keys

Never hardcode query keys.

Use centralized key factories.

Example

studentKeys.all

studentKeys.detail(id)

studentKeys.list(filters)

---

# Query Structure

List

["students", "list", filters]

Detail

["students", id]

Activity

["students", id, "activity"]

Stats

["students", "stats"]

---

# Create

If API returns the created resource:

- setQueryData(detail)

Always:

- invalidate list

---

# Update

If API returns the updated resource:

- setQueryData(detail)

Always:

- invalidate affected lists

Never use removeQueries after update.

---

# Delete

Always

- removeQueries(detail)

- invalidate list

---

# Optimistic Update

Only use optimistic updates when rollback is implemented.

Otherwise use standard mutation flow.

---

# Query Keys

Each module must expose

studentKeys

teacherKeys

courseKeys

classKeys

attendanceKeys

...

Never hardcode query keys inside components.
