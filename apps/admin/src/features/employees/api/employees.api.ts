import { api } from "../../../lib/api-client";

export const employeesApi = {
  getAll: (p?: unknown) => api.get("/employees", { params: p }),
  getOne: (id: string) => api.get(`/employees/${id}`),
  create: (d: unknown) => api.post("/employees", d),
  update: (id: string, d: unknown) => api.patch(`/employees/${id}`, d),
  delete: (id: string) => api.delete(`/employees/${id}`),
  availableUsers: () => api.get("/employees/available-users"),
  linkUser: (id: string, data: { userId: string }) => api.post(`/employees/${id}/link-user`, data),
  createUser: (id: string, data: unknown) => api.post(`/employees/${id}/create-user`, data),
  unlinkUser: (id: string) => api.delete(`/employees/${id}/unlink-user`),
};
