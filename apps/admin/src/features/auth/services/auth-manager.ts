import { authApi } from "../api/auth.api";
import { authStorage } from "../auth-storage";
import { useAuthStore } from "../../../store/auth.store";
import { queryClient } from "../../../lib/query-client";
import { getData } from "../../../lib/api-client";
import type { AuthUser } from "../../../types";

export const authManager = {
  async login(dto: { email: string; password: string }): Promise<void> {
    const res = await authApi.login(dto);
    const { accessToken, user } = getData<{ accessToken: string; user: AuthUser }>(res);
    authStorage.setToken(accessToken);
    useAuthStore.getState().setUser(user);
  },

  async register(dto: unknown): Promise<void> {
    const res = await authApi.register(dto);
    const { accessToken, user } = getData<{ accessToken: string; user: AuthUser }>(res);
    authStorage.setToken(accessToken);
    useAuthStore.getState().setUser(user);
  },

  async handleOAuthCallback(code: string): Promise<void> {
    const res = await authApi.exchangeOAuthCode(code);
    const { accessToken, user } = getData<{ accessToken: string; user: AuthUser }>(res);
    authStorage.setToken(accessToken);
    useAuthStore.getState().setUser(user);
  },

  async logout(): Promise<void> {
    await authApi.logout().catch(() => {});
    authManager.logoutAndRedirect();
  },

  // Called by interceptor when refresh token is dead, and by logout()
  logoutAndRedirect(): void {
    authStorage.removeToken();
    useAuthStore.getState().clearAuth();
    queryClient.clear();
    window.location.href = "/login";
  },

  // Called by interceptor after a successful silent refresh
  setToken(token: string): void {
    authStorage.setToken(token);
  },

  // Called by AuthProvider on app start — token check is an implementation detail
  async hydrate(): Promise<void> {
    if (!authStorage.getToken()) return;
    const res = await authApi.me();
    const user = getData<AuthUser>(res);
    useAuthStore.getState().setUser(user);
  },
};
