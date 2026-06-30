export const subjectKeys = {
  all: ["subjects"] as const,
  lists: () => [...subjectKeys.all, "list"] as const,
  list: (filters: { search?: string; status?: string; page?: number }) =>
    [...subjectKeys.lists(), filters] as const,
  details: () => [...subjectKeys.all, "detail"] as const,
  detail: (id: string) => [...subjectKeys.details(), id] as const,
  activity: (id: string) => [...subjectKeys.detail(id), "activity"] as const,
};
