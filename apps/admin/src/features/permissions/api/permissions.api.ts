import { api } from "../../../lib/api-client";

export const permissionsApi = {
  getAll: () => api.get("/permissions"),
};
