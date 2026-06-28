import { api } from "../../../lib/api-client";

export const studentsApi = {
  getAll: (p?: unknown) => api.get("/students", { params: p }),
  getOne: (id: string) => api.get(`/students/${id}`),
  create: (d: unknown) => api.post("/students", d),
  update: (id: string, d: unknown) => api.patch(`/students/${id}`, d),
  delete: (id: string) => api.delete(`/students/${id}`),
};
