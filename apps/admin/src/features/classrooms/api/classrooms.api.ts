import { api } from "../../../lib/api-client";

export const classroomsApi = {
  getAll: (p?: unknown) => api.get("/classrooms", { params: p }),
  getOne: (id: string) => api.get(`/classrooms/${id}`),
  create: (d: unknown) => api.post("/classrooms", d),
  update: (id: string, d: unknown) => api.patch(`/classrooms/${id}`, d),
  delete: (id: string) => api.delete(`/classrooms/${id}`),
};
