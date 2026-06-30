import { api } from "../../../lib/api-client";

export const coursesApi = {
  getAll: (p?: unknown) => api.get("/courses", { params: p }),
  getOne: (id: string) => api.get(`/courses/${id}`),
  create: (d: unknown) => api.post("/courses", d),
  update: (id: string, d: unknown) => api.patch(`/courses/${id}`, d),
  delete: (id: string) => api.delete(`/courses/${id}`),
};
