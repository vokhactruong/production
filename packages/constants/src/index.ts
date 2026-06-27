// ─── Roles ────────────────────────────────────────────────────────────────────

export enum ROLES {
  SUPER_ADMIN = "Super Admin",
  ADMIN = "Admin",
  EDITOR = "Editor",
  TEACHER = "Teacher",
  STUDENT = "Student",
  PARENT = "Parent",
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export enum PERMISSIONS {
  DASHBOARD_VIEW = "dashboard.view",

  USER_CREATE = "user.create",
  USER_READ = "user.read",
  USER_UPDATE = "user.update",
  USER_DELETE = "user.delete",

  ROLE_CREATE = "role.create",
  ROLE_READ = "role.read",
  ROLE_UPDATE = "role.update",
  ROLE_DELETE = "role.delete",

  PERMISSION_READ = "permission.read",
  PERMISSION_ASSIGN = "permission.assign",

  ARTICLE_CREATE = "article.create",
  ARTICLE_READ = "article.read",
  ARTICLE_UPDATE = "article.update",
  ARTICLE_DELETE = "article.delete",
  ARTICLE_PUBLISH = "article.publish",
  ARTICLE_MANAGE = "article.manage",

  CATEGORY_CREATE = "category.create",
  CATEGORY_READ = "category.read",
  CATEGORY_UPDATE = "category.update",
  CATEGORY_DELETE = "category.delete",

  UPLOAD_FILE = "upload.file",
  PROFILE_UPDATE = "profile.update",
}

// ─── Article Status ───────────────────────────────────────────────────────────

export enum ARTICLE_STATUS {
  DRAFT = "DRAFT",
  REVIEW = "REVIEW",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    CALLBACK: "/auth/callback",
  },
  DASHBOARD: "/dashboard",
  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  CATEGORIES: "/categories",
  ARTICLES: {
    LIST: "/articles",
    NEW: "/articles/new",
    EDIT: (id: string) => `/articles/${id}/edit`,
    PREVIEW: (id: string) => `/articles/${id}/preview`,
  },
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

// ─── API Routes ───────────────────────────────────────────────────────────────

export const API_ROUTES = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    GOOGLE: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
  },
  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  CATEGORIES: "/categories",
  ARTICLES: "/articles",
  UPLOAD: "/upload",
  AUDIT_LOGS: "/audit-logs",
} as const;

// ─── Cookie Names ─────────────────────────────────────────────────────────────

export const COOKIE_NAMES = {
  REFRESH_TOKEN: "refreshToken",
  OAUTH_STATE: "oauth_state",
} as const;

// ─── User Status ──────────────────────────────────────────────────────────────

export enum USER_STATUS {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}
