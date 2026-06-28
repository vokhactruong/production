import { api } from "../../../lib/api-client";

export const categoriesApi = {
  getAll: () => api.get("/categories"),
  create: (d: unknown) => api.post("/categories", d),
  update: (id: string, d: unknown) => api.patch(`/categories/${id}`, d),
  delete: (id: string) => api.delete(`/categories/${id}`),
};
