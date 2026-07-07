export const classroomKeys = {
  all: ["classrooms"] as const,
  lists: () => [...classroomKeys.all, "list"] as const,
  list: (filters: { search?: string; type?: string; isActive?: string; page?: number }) =>
    [...classroomKeys.lists(), filters] as const,
  details: () => [...classroomKeys.all, "detail"] as const,
  detail: (id: string) => [...classroomKeys.details(), id] as const,
  activity: (id: string) => [...classroomKeys.detail(id), "activity"] as const,
};
