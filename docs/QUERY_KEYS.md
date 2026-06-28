# QUERY_KEYS.md

# TanStack Query Key Standards

This document defines the query key conventions for the Education Center Management SaaS.

Every module must follow the same query key structure.

Never hardcode query keys inside components.

---

# Goals

Query keys must be

- Predictable
- Consistent
- Type-safe
- Easy to invalidate
- Easy to extend

---

# General Rules

Every feature owns its own key factory.

Example

studentKeys

teacherKeys

courseKeys

attendanceKeys

tuitionKeys

Never share query keys between modules.

---

# Key Factory Structure

Every module should expose the following structure.

Example

studentKeys = {

all

lists

list(filters)

details

detail(id)

activity(id)

statistics()

}

Keep naming consistent across every module.

---

# Standard Structure

Every module should follow

all

lists

list(filters)

details

detail(id)

statistics()

related()

Example

students

↓

studentKeys.all

↓

studentKeys.lists()

↓

studentKeys.list(filters)

↓

studentKeys.details()

↓

studentKeys.detail(id)

---

# Example

studentKeys = {

all

["students"]

lists

["students","list"]

list(filters)

["students","list",filters]

details

["students","detail"]

detail(id)

["students","detail",id]

activity(id)

["students","detail",id,"activity"]

statistics

["students","statistics"]

}

---

# Query Key Naming

Always use plural resource names.

Good

students

teachers

courses

classes

attendance

tuitions

users

roles

permissions

Bad

student

teacher

Student

StudentList

---

# Detail Queries

Always use

detail(id)

Never use

["student",id]

Use

["students","detail",id]

This creates a predictable hierarchy.

---

# List Queries

Always include filters.

Good

studentKeys.list({

page,

search,

status

})

Bad

["students"]

This prevents cache collisions.

---

# Statistics Queries

Statistics must have independent keys.

Example

studentKeys.statistics()

teacherKeys.statistics()

dashboardKeys.statistics()

Never mix statistics with list data.

---

# Activity Queries

Timeline-like data must have dedicated keys.

Example

studentKeys.activity(id)

teacherKeys.activity(id)

courseKeys.activity(id)

---

# Nested Resources

Examples

Student Attendance

studentKeys.attendance(id)

↓

["students","detail",id,"attendance"]

Student Tuition

↓

["students","detail",id,"tuition"]

Student Enrollments

↓

["students","detail",id,"enrollments"]

Keep nesting predictable.

---

# Dashboard

Dashboard should have its own keys.

dashboardKeys.summary()

dashboardKeys.revenue()

dashboardKeys.attendance()

dashboardKeys.notifications()

Never reuse resource keys.

---

# Search

Search parameters belong inside list().

Good

studentKeys.list({

page,

search,

status

})

Bad

studentKeys.search()

---

# Mutation Rules

## Create

If API returns created resource

setQueryData(detail)

Always

invalidate list

---

## Update

If API returns updated resource

setQueryData(detail)

Invalidate

affected lists

affected statistics

if necessary

Never remove detail cache after update.

---

## Delete

Always

removeQueries(detail)

Invalidate

list

statistics (if affected)

---

# Optimistic Updates

Use only when rollback is implemented.

Otherwise

prefer

setQueryData

-

invalidateQueries

---

# Invalidation Scope

Prefer the smallest possible scope.

Good

invalidate

studentKeys.list(...)

Bad

invalidate

all queries

Never invalidate unrelated modules.

---

# Query Client

Do not use hardcoded query keys.

Bad

queryClient.invalidateQueries({

queryKey:

["students"]

})

Good

queryClient.invalidateQueries({

queryKey:

studentKeys.all

})

---

# Feature Isolation

Each feature owns

API

Hooks

Query Keys

Mutations

Never reference another module's query keys unless the mutation affects that module.

---

# Query Key Files

Every feature should have

student.keys.ts

teacher.keys.ts

course.keys.ts

attendance.keys.ts

tuition.keys.ts

dashboard.keys.ts

---

# Folder Structure

features/

students/

api/

students.api.ts

student.keys.ts

use-students.ts

use-student.ts

use-create-student.ts

use-update-student.ts

use-delete-student.ts

---

# Cache Ownership

Each hook owns its cache.

Example

useStudent()

↓

studentKeys.detail(id)

useStudents()

↓

studentKeys.list(filters)

Never share query logic across unrelated hooks.

---

# Infinite Queries

Infinite queries require dedicated keys.

Good

studentKeys.infinite(filters)

Never reuse

list()

for infinite scrolling.

---

# Query Key Stability

Query keys must be serializable.

Never include

Functions

Class instances

Date objects

DOM elements

Always use

Strings

Numbers

Booleans

Plain Objects

---

# Filter Objects

Keep filter objects stable.

Good

{

page,

search,

status

}

Bad

{

page,

search,

status,

callback

}

---

# Cache Lifetime

Default behavior should be sufficient.

Only customize

staleTime

gcTime

when business requirements justify it.

Avoid arbitrary values.

---

# AI Development Rules

When implementing a new module:

1.

Create a dedicated key factory.

2.

Never hardcode query keys.

3.

Keep hierarchy consistent.

4.

Prefer fine-grained invalidation.

5.

Use

setQueryData

after update.

6.

Use

removeQueries

after delete.

7.

Invalidate only affected lists.

8.

Keep query keys type-safe.

9.

One feature owns one key factory.

10.

Query keys are part of the public architecture and should remain stable across the project.

The goal is to create a predictable caching system that scales to dozens of modules while remaining easy to maintain.
