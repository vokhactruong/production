// ─── User ────────────────────────────────────────────────────────────────────

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
  _count?: { userRoles: number };
}

// ─── Permission ──────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

// ─── Article ──────────────────────────────────────────────────────────────────

export type ArticleStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  thumbnail?: string;
  thumbnailPublicId?: string;
  status: ArticleStatus;
  publishedAt?: string;
  viewCount: number;
  tags: string[];
  authorId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, "id" | "firstName" | "lastName" | "avatar">;
  category?: Category;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { articles: number };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
  publicId: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  createdAt: string;
  user?: Pick<User, "id" | "firstName" | "lastName" | "email">;
}

// ─── Student ──────────────────────────────────────────────────────────────────

export type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Student {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  avatar?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  status: StudentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Subject ──────────────────────────────────────────────────────────────────

export type SubjectStatus = "ACTIVE" | "INACTIVE";

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status: SubjectStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export type CourseType = "NORMAL" | "TRIAL";
export type CourseStatus = "ACTIVE" | "INACTIVE";

export interface Course {
  id: string;
  subjectId: string;
  code: string;
  name: string;
  description?: string;
  courseType: CourseType;
  packageLessons: number;
  lessonDuration: number;
  basePrice: string;
  displayOrder: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    code: string;
    name: string;
  };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface UserStats {
  total: number;
  teachers: number;
  students: number;
  parents: number;
  admins: number;
}
