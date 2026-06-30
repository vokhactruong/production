export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters: { search?: string; subjectId?: string; status?: string; page?: number }) =>
    [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  activity: (id: string) => [...courseKeys.detail(id), "activity"] as const,
};
