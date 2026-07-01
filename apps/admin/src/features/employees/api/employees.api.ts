import { api } from "../../../lib/api-client";

export const employeesApi = {
  getAll: (p?: unknown) => api.get("/employees", { params: p }),
  getOne: (id: string) => api.get(`/employees/${id}`),
  create: (d: unknown) => api.post("/employees", d),
  update: (id: string, d: unknown) => api.patch(`/employees/${id}`, d),
  delete: (id: string) => api.delete(`/employees/${id}`),
};
