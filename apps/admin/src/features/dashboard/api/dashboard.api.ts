import { api } from "../../../lib/api-client";

export interface DashboardStats {
  userCount: number | null;
  roleCount: number | null;
  permCount: number | null;
  catCount: number | null;
  recentArticles: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    author: { firstName: string; lastName: string } | null;
  }> | null;
}

export const dashboardApi = {
  getStats: () => api.get<{ data: DashboardStats }>("/dashboard/stats").then((r) => r.data.data),
};
