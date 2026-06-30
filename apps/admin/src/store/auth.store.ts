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
  isAuthenticated: boolean;
  isHydrating: boolean;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setHydrating: (v: boolean) => void;
  hasPermission: (code: string) => boolean;
  hasRole: (name: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrating: true,

      setUser: (user) => set({ user, isAuthenticated: true }),

      // Rule 2: Store ONLY manages user state — token and cache are not store concerns
      clearAuth: () => set({ user: null, isAuthenticated: false }),

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
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setTheme: (t: "light" | "dark") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: "light",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        set({ theme });
      },
    }),
    {
      name: "ui-store",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }),
    }
  )
);
