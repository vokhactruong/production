import { api } from "../../../lib/api-client";

export const articlesApi = {
  getAdminList: (p?: unknown) => api.get("/articles/admin", { params: p }),
  getAdminOne: (id: string) => api.get(`/articles/admin/${id}`),
  create: (d: unknown) => api.post("/articles", d),
  update: (id: string, d: unknown) => api.patch(`/articles/${id}`, d),
  delete: (id: string) => api.delete(`/articles/${id}`),
  publish: (id: string) => api.patch(`/articles/${id}/publish`),
  unpublish: (id: string) => api.patch(`/articles/${id}/unpublish`),
  archive: (id: string) => api.patch(`/articles/${id}/archive`),
};
