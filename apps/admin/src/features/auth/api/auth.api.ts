import { api } from "../../../lib/api-client";

export const authApi = {
  login: (d: { email: string; password: string }) => api.post("/auth/login", d),
  register: (d: unknown) => api.post("/auth/register", d),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (d: { token: string; password: string }) => api.post("/auth/reset-password", d),
  exchangeOAuthCode: (code: string) => api.post("/auth/oauth/exchange", { code }),
};
