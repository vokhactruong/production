export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: { search?: string; status?: string; page?: number }) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  activity: (id: string) => [...studentKeys.detail(id), "activity"] as const,
};

export const auditLogKeys = {
  forEntity: (entity: string, entityId: string, limit: number) =>
    ["audit-logs", entity, entityId, limit] as const,
};
