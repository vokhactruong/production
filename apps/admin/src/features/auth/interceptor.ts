import axios from "axios";
import { api } from "../../lib/api-client";
import { authManager } from "./services/auth-manager";

let isRefreshing = false;
let queue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const original = error.config as typeof error.config & { _retry?: boolean };

    // Rule 6: refresh endpoint returning 401 = both tokens dead → logout immediately
    if (original?.url?.includes("/auth/refresh")) {
      processQueue(error, null);
      authManager.logoutAndRedirect();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      // Rule 5: queue concurrent 401s — only one silent refresh runs at a time
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Rule 4: interceptor is the only place that silently refreshes
        const { data } = await api.post<{ data: { accessToken: string } }>("/auth/refresh");
        const newToken = data.data.accessToken;
        authManager.setToken(newToken);
        processQueue(null, newToken);
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        authManager.logoutAndRedirect();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
