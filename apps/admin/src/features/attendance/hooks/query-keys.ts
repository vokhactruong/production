export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (filters: {
    classSessionId?: string;
    classId?: string;
    studentId?: string;
    status?: string;
    page?: number;
  }) => [...attendanceKeys.lists(), filters] as const,
  details: () => [...attendanceKeys.all, "detail"] as const,
  detail: (id: string) => [...attendanceKeys.details(), id] as const,
  // One session's full roster attendance (the recording screen) — a nested
  // resource key, separate from the paginated history list.
  sessions: () => [...attendanceKeys.all, "session"] as const,
  session: (classSessionId: string) => [...attendanceKeys.sessions(), classSessionId] as const,
};
