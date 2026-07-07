import { api } from "../../../lib/api-client";

export const classSchedulesApi = {
  getAll: (p?: unknown) => api.get("/class-schedules", { params: p }),
  getOne: (id: string) => api.get(`/class-schedules/${id}`),
  create: (d: unknown) => api.post("/class-schedules", d),
  update: (id: string, d: unknown) => api.patch(`/class-schedules/${id}`, d),
  delete: (id: string) => api.delete(`/class-schedules/${id}`),
};
