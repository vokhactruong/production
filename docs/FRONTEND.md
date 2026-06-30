# FRONTEND.md

Folder Structure

Component Rules

React Hook Form

Zod

TanStack Query

Error Handling

Loading States

Empty States

Accessibility

Responsive Design

Shadcn UI

DataTable Rules

## Form Rules

Every edit form must implement:

- Loading State
- Error State
- Success State

Never render an editable blank form while the original data is still loading or when loading has failed.

## Responsive Philosophy

The Admin Portal is Desktop-first.

Priority:

1. Desktop (Primary)
2. Laptop
3. Tablet
4. Mobile (Graceful Degradation)

Do not redesign data-heavy screens for mobile.

For tables:

- Desktop: Full table.
- Tablet/Mobile: Horizontal scroll is acceptable.

Do not convert every table into cards unless there is a strong UX reason.
