import { api } from "../../../lib/api-client";

export const usersApi = {
  getAll: (p?: unknown) => api.get("/users", { params: p }),
  getOne: (id: string) => api.get(`/users/${id}`),
  getStats: () => api.get("/users/stats"),
  create: (d: unknown) => api.post("/users", d),
  update: (id: string, d: unknown) => api.patch(`/users/${id}`, d),
  delete: (id: string) => api.delete(`/users/${id}`),
};
