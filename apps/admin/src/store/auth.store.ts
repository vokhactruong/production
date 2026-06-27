import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setHydrating: (v: boolean) => void;
  hasPermission: (code: string) => boolean;
  hasRole: (name: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: true,

      setAuth: (user, accessToken) => {
        localStorage.setItem("accessToken", accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setHydrating: (v) => set({ isHydrating: v }),

      hasPermission: (code) => {
        const { user } = get();
        if (!user) return false;
        return user.permissions.includes(code);
      },

      hasRole: (name) => {
        const { user } = get();
        return user?.roles.includes(name) ?? false;
      },
    }),
    {
      name: "auth-store",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setTheme: (t: "light" | "dark") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        set({ theme });
      },
    }),
    { name: "ui-store" }
  )
);
