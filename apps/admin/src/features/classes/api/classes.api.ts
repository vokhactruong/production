import { api } from "../../../lib/api-client";

export const classesApi = {
  getAll: (p?: unknown) => api.get("/classes", { params: p }),
  getOne: (id: string) => api.get(`/classes/${id}`),
  create: (d: unknown) => api.post("/classes", d),
  update: (id: string, d: unknown) => api.patch(`/classes/${id}`, d),
  delete: (id: string) => api.delete(`/classes/${id}`),
  generateSessions: (id: string) => api.post(`/classes/${id}/generate-sessions`),
  syncSessions: (id: string) => api.post(`/classes/${id}/sync-sessions`),
};
