export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (filters: { search?: string; status?: string; courseId?: string; page?: number }) =>
    [...classKeys.lists(), filters] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  activity: (id: string) => [...classKeys.detail(id), "activity"] as const,
};
