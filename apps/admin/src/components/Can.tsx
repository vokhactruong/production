import React from "react";
import { useAuthStore } from "../store/auth.store";

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Can({ permission, children, fallback = null }: CanProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
