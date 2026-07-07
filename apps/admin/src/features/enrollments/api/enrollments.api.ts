import { api } from "../../../lib/api-client";

export const enrollmentsApi = {
  getAll: (p?: unknown) => api.get("/enrollments", { params: p }),
  getOne: (id: string) => api.get(`/enrollments/${id}`),
  create: (d: unknown) => api.post("/enrollments", d),
  update: (id: string, d: unknown) => api.patch(`/enrollments/${id}`, d),
  delete: (id: string) => api.delete(`/enrollments/${id}`),
};
