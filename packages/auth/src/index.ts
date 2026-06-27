import type { AuthUser } from "@school/types";

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

// ─── Permission Helpers ───────────────────────────────────────────────────────

export function hasPermission(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: string[]
): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(
  user: AuthUser | null | undefined,
  permissions: string[]
): boolean {
  if (!user) return false;
  return permissions.every((p) => user.permissions.includes(p));
}

// ─── Role Helpers ─────────────────────────────────────────────────────────────

export function hasRole(user: AuthUser | null | undefined, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser | null | undefined, roles: string[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
