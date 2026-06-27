# School Portal

A full-stack educational portal built with TurboRepo monorepo.

## Stack

| App          | Technology                           |
| ------------ | ------------------------------------ |
| Backend      | NestJS 10 + Prisma 5 + PostgreSQL 16 |
| Admin        | React 19 + Vite + Tailwind CSS       |
| Public       | Next.js 15 App Router                |
| Architecture | TurboRepo + PNPM Workspace           |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start database
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start all apps in dev mode
pnpm dev
```

## Default Credentials

| Role        | Email                 | Password      |
| ----------- | --------------------- | ------------- |
| Super Admin | superadmin@school.com | Admin@123456  |
| Admin       | admin@school.com      | Admin@123456  |
| Editor      | editor@school.com     | Editor@123456 |
