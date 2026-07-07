export const classScheduleKeys = {
  all: ["class-schedules"] as const,
  lists: () => [...classScheduleKeys.all, "list"] as const,
  list: (filters: { classId?: string }) => [...classScheduleKeys.lists(), filters] as const,
  details: () => [...classScheduleKeys.all, "detail"] as const,
  detail: (id: string) => [...classScheduleKeys.details(), id] as const,
};
