import axios from "axios";
import { authStorage } from "../features/auth/auth-storage";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Rule 9: Only the request interceptor reads the token
api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor lives in features/auth/interceptor.ts
// It is registered as a side effect via main.tsx

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
