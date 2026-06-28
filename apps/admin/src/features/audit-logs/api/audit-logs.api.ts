import { api } from "../../../lib/api-client";

export const auditLogsApi = {
  getAll: (p?: unknown) => api.get("/audit-logs", { params: p }),
  getForEntity: (entity: string, entityId: string, p?: Record<string, unknown>) =>
    api.get("/audit-logs", { params: { entity, entityId, ...p } }),
};
