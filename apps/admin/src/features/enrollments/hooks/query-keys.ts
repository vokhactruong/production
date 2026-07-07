export const enrollmentKeys = {
  all: ["enrollments"] as const,
  lists: () => [...enrollmentKeys.all, "list"] as const,
  list: (filters: {
    search?: string;
    studentId?: string;
    classId?: string;
    status?: string;
    page?: number;
  }) => [...enrollmentKeys.lists(), filters] as const,
  details: () => [...enrollmentKeys.all, "detail"] as const,
  detail: (id: string) => [...enrollmentKeys.details(), id] as const,
  activity: (id: string) => [...enrollmentKeys.detail(id), "activity"] as const,
};
