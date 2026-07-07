import { api } from "../../../lib/api-client";

export const classSessionsApi = {
  getAll: (p?: unknown) => api.get("/class-sessions", { params: p }),
  getOne: (id: string) => api.get(`/class-sessions/${id}`),
  create: (d: unknown) => api.post("/class-sessions", d),
  update: (id: string, d: unknown) => api.patch(`/class-sessions/${id}`, d),
  delete: (id: string) => api.delete(`/class-sessions/${id}`),
};
