import { api } from "../../../lib/api-client";

export const subjectsApi = {
  getAll: (p?: unknown) => api.get("/subjects", { params: p }),
  getOne: (id: string) => api.get(`/subjects/${id}`),
  create: (d: unknown) => api.post("/subjects", d),
  update: (id: string, d: unknown) => api.patch(`/subjects/${id}`, d),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};
