import { useAuthStore } from "../../../store/auth.store";

export function useAuth() {
  return useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    hasPermission: s.hasPermission,
    hasRole: s.hasRole,
  }));
}
