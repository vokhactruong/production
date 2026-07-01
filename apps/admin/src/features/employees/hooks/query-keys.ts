export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (filters: { search?: string; employeeType?: string; status?: string; page?: number }) =>
    [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  activity: (id: string) => [...employeeKeys.detail(id), "activity"] as const,
};
