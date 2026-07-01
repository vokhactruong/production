# CACHE.md

## Purpose

Caching strategy and mutation flow rules for the Admin Portal.

All TanStack Query hooks must follow these rules.

---

## Separation of Responsibilities

### Mutation Hook — Responsible for

- API calls (`mutationFn`)
- Immediate cache updates using the server response:
  - `setQueryData(detail)` — update detail cache with returned resource
  - `removeQueries(detail)` — clean up detail cache on delete

### Mutation Hook — Never responsible for

- Toast notifications
- Navigation (`navigate()`)
- Dialog state (`setOpen(false)`)
- Invalidating or refetching list queries (see Delete exception below)
- Dashboard invalidation

### Page / Component — Responsible for

- User feedback (toast, loading indicators)
- Navigation after mutation completes
- Dialog open/close state
- Refetch before navigation (Pattern B)
- Dashboard invalidation (fire and forget, never awaited)

---

## Update Mutation Patterns

### Pattern A — Stay on current page

Use when the UI does **not** navigate after the mutation (inline edit, dialog, toggle status).

```typescript
// Mutation hook
onSuccess(response) {
  qc.setQueryData(xxxKeys.detail(id), getData(response));
}

// Component
mutation.mutate(payload, {
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: xxxKeys.lists() });
    emitToast("Cập nhật thành công", "success");
    setOpen(false);
  },
  onError: (err) => emitToast(extractErrorMessage(err), "error"),
});
```

**Applies to:** Toggle status, inline edit, quick-edit dialog

---

### Pattern B — Navigate back to list ⭐

Use when the UI navigates to the list page after the mutation (Edit Form, Create Form).

```typescript
// Mutation hook — only manages cache
onSuccess(response) {
  qc.setQueryData(xxxKeys.detail(id), getData(response));
}

// Component — manages full UX flow
const qc = useQueryClient();

// Inside async submit handler:
try {
  await mutation.mutateAsync(payload);
  await qc.refetchQueries({ queryKey: xxxKeys.lists(), type: "all" });
  emitToast("Cập nhật thành công", "success");
  navigate("/xxx");
} catch (err) {
  emitToast(extractErrorMessage(err), "error");
}
```

**Why `await refetchQueries` before `navigate`:**
When the user is on an Edit Form, the list page is not mounted and has no active observers.
`invalidateQueries` only marks queries stale and awaits active observers — since none exist,
it resolves immediately and the list renders stale data after navigation.
`refetchQueries({ type: "all" })` refetches even inactive cached queries, so the list is
fresh before the component mounts.

**Why not `setQueriesData`:**
Manually patching list cache assumes the updated record still matches the current filter,
sort, and page. This assumption breaks when status, price, or sort fields change. The server
is the single source of truth for list state.

**Applies to:** Edit Form, Create Form, Wizard, Multi-step Form

---

## Create Pattern

```typescript
// Mutation hook — cache the created resource if API returns it
onSuccess(response) {
  const created = getData(response);
  qc.setQueryData(xxxKeys.detail(created.id), created);
}

// Component — always Pattern B (create then navigate to list)
try {
  await mutation.mutateAsync(payload);
  await qc.refetchQueries({ queryKey: xxxKeys.lists(), type: "all" });
  emitToast("Tạo thành công", "success");
  navigate("/xxx");
} catch (err) {
  emitToast(extractErrorMessage(err), "error");
}
```

If the API does not return the created resource, omit `onSuccess` from the hook entirely.

---

## Delete Pattern

```typescript
// Mutation hook — cache cleanup (exception to separation rule)
onSuccess(_, id) {
  qc.removeQueries({ queryKey: xxxKeys.detail(id) });
  qc.invalidateQueries({ queryKey: xxxKeys.lists() });
}

// Component — UX only
mutation.mutate(id, {
  onSuccess: () => {
    emitToast("Đã xóa", "success");
    setDeleteDialog(null);
  },
  onError: (err) => emitToast(extractErrorMessage(err), "error"),
});
```

**Exception:** Delete is always Pattern A — the user is already on the list page when
triggering delete. The list query is always active, so `invalidateQueries` in the hook
refetches immediately and produces correct results. Moving it to the component would
add complexity with no benefit.

---

## Dashboard

Dashboard stats are never awaited. Always fire and forget from the component.

```typescript
// After mutation completes — no await
qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
```

Do not put dashboard invalidation inside mutation hooks.

---

## Error Handling

### Mutation Hook

Hooks only propagate errors via `throw`. Never toast, log, or transform errors inside a hook.

```typescript
// Default — useMutation re-throws automatically
mutationFn: (data) => api.update(id, data),
```

### Component

Components catch and display errors from `mutateAsync`.

```typescript
try {
  await mutation.mutateAsync(payload);
  // success path
} catch (err) {
  emitToast(extractErrorMessage(err), "error");
}
```

---

## Query Keys

Never hardcode query keys. Always use the module's key factory.

```typescript
// ✅ Correct
qc.refetchQueries({ queryKey: courseKeys.lists(), type: "all" });

// ❌ Wrong
qc.refetchQueries({ queryKey: ["courses", "list"], type: "all" });
```

Each module must export a key factory:

```typescript
export const xxxKeys = {
  all: ["xxx"] as const,
  lists: () => [...xxxKeys.all, "list"] as const,
  list: (filters) => [...xxxKeys.lists(), filters] as const,
  details: () => [...xxxKeys.all, "detail"] as const,
  detail: (id: string) => [...xxxKeys.details(), id] as const,
};
```

---

## Query Structure

```
List      → ["module", "list", filters]
Detail    → ["module", "detail", id]
Activity  → ["module", "detail", id, "activity"]
Stats     → ["module", "stats"]
```

---

## Never Use setQueriesData for Paginated Lists

Do not use `setQueriesData` to manually patch lists that have search, filter, sort, or pagination.

**Only use `setQueriesData`** for simple flat lists with no filter/sort/pagination
(e.g., a static dropdown of all active roles or countries).
