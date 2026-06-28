import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
