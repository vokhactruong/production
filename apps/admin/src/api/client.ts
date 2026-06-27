import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor — Auto Refresh ─────────────────────────────────────
let isRefreshing = false;
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await api.post<{ data: { accessToken: string } }>("/auth/refresh");
        const newToken = data.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        processQueue(null, newToken);
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getData<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

export function getList<T>(res: { data: { data: { items: T[]; meta: PaginationMeta } } }) {
  return res.data.data;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const authApi = {
  login: (d: { email: string; password: string }) => api.post("/auth/login", d),
  register: (d: unknown) => api.post("/auth/register", d),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (d: { token: string; password: string }) => api.post("/auth/reset-password", d),
};

export const usersApi = {
  getAll: (p?: unknown) => api.get("/users", { params: p }),
  getOne: (id: string) => api.get(`/users/${id}`),
  getStats: () => api.get("/users/stats"),
  create: (d: unknown) => api.post("/users", d),
  update: (id: string, d: unknown) => api.patch(`/users/${id}`, d),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const rolesApi = {
  getAll: () => api.get("/roles"),
  getOne: (id: string) => api.get(`/roles/${id}`),
  create: (d: unknown) => api.post("/roles", d),
  update: (id: string, d: unknown) => api.patch(`/roles/${id}`, d),
  delete: (id: string) => api.delete(`/roles/${id}`),
  assignPermissions: (id: string, ids: string[]) =>
    api.post(`/roles/${id}/permissions`, { permissionIds: ids }),
};

export const permissionsApi = {
  getAll: () => api.get("/permissions"),
};

export const categoriesApi = {
  getAll: () => api.get("/categories"),
  create: (d: unknown) => api.post("/categories", d),
  update: (id: string, d: unknown) => api.patch(`/categories/${id}`, d),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

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

export const uploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteImage: (publicId: string) => api.delete("/upload/image", { data: { publicId } }),
};

export const auditLogsApi = {
  getAll: (p?: unknown) => api.get("/audit-logs", { params: p }),
};

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
