# BACKEND.md

Architecture

Controller

↓

Service

↓

Repository

↓

Prisma

No business logic inside controllers.

No Prisma inside controllers.

Repositories only perform data access.

Services contain all business logic.
