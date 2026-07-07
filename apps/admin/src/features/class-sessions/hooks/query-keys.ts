export const classSessionKeys = {
  all: ["class-sessions"] as const,
  lists: () => [...classSessionKeys.all, "list"] as const,
  list: (filters: {
    search?: string;
    classId?: string;
    status?: string;
    date?: string;
    page?: number;
  }) => [...classSessionKeys.lists(), filters] as const,
  details: () => [...classSessionKeys.all, "detail"] as const,
  detail: (id: string) => [...classSessionKeys.details(), id] as const,
  activity: (id: string) => [...classSessionKeys.detail(id), "activity"] as const,
};
