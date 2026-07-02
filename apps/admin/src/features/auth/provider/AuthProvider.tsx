import React, { useEffect } from "react";
import { authManager } from "../services/auth-manager";
import { useAuthStore } from "../../../store/auth.store";
import SplashScreen from "../../../components/SplashScreen";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const setHydrating = useAuthStore((s) => s.setHydrating);

  useEffect(() => {
    // Rule 3: AuthProvider only hydrates — no token logic here
    authManager.hydrate().finally(() => setHydrating(false));
  }, []);

  if (isHydrating) return <SplashScreen />;
  return <>{children}</>;
}
