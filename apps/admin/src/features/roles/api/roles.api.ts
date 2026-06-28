import { api } from "../../../lib/api-client";

export const rolesApi = {
  getAll: () => api.get("/roles"),
  getOne: (id: string) => api.get(`/roles/${id}`),
  create: (d: unknown) => api.post("/roles", d),
  update: (id: string, d: unknown) => api.patch(`/roles/${id}`, d),
  delete: (id: string) => api.delete(`/roles/${id}`),
  assignPermissions: (id: string, ids: string[]) =>
    api.post(`/roles/${id}/permissions`, { permissionIds: ids }),
};
