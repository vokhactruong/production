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

// ─── Employee ─────────────────────────────────────────────────────────────────

export type EmployeeType =
  | "TEACHER"
  | "RECEPTIONIST"
  | "ACCOUNTANT"
  | "ACADEMIC"
  | "MANAGER"
  | "DIRECTOR"
  | "OTHER";

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED";

export interface EmployeeLinkedUser {
  id: string;
  email: string;
  status: string;
  roles: Array<{ id: string; name: string }>;
}

export interface Employee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
  employeeType: EmployeeType;
  hireDate?: string;
  status: EmployeeStatus;
  notes?: string;
  userId?: string | null;
  user?: EmployeeLinkedUser | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Classroom ────────────────────────────────────────────────────────────────

export type ClassroomType = "PHYSICAL" | "ONLINE" | "LAB";

export interface Classroom {
  id: string;
  code: string;
  name: string;
  type: ClassroomType;
  capacity: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Class ────────────────────────────────────────────────────────────────────

export type ClassStatus = "PLANNING" | "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

export interface Class {
  id: string;
  code: string;
  name: string;
  courseId: string;
  subjectId: string;
  classroomId: string;
  employeeId: string;
  status: ClassStatus;
  capacity: number;
  sessionCount: number;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; code: string; name: string };
  subject?: { id: string; code: string; name: string };
  classroom?: { id: string; code: string; name: string };
  employee?: { id: string; code: string; firstName: string; lastName: string };
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export type EnrollmentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: EnrollmentStatus;
  joinedAt: string;
  billingCycleSessions: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; code?: string; firstName: string; lastName: string; status: string };
  class?: {
    id: string;
    code: string;
    name: string;
    capacity: number;
    sessionCount: number;
    status: ClassStatus;
    startDate: string;
    endDate: string;
  };
}

// ─── Class Session ────────────────────────────────────────────────────────────

export type ClassSessionStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";

export interface ClassSession {
  id: string;
  classId: string;
  sessionNumber: number;
  status: ClassSessionStatus;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    code: string;
    name: string;
    status: ClassStatus;
    startDate: string;
    endDate: string;
    employee?: { id: string; firstName: string; lastName: string };
    classroom?: { id: string; name: string };
  };
}

// ─── Class Schedule (Planning Layer) ──────────────────────────────────────────
// The recurring weekly template a Class meets on. SchedulingService reads
// this to generate ClassSession rows (the Execution Layer) — editing a
// ClassSchedule never touches already-generated sessions.

export interface ClassSchedule {
  id: string;
  classId: string;
  /** 0 = Sunday .. 6 = Saturday */
  weekday: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSessionsResult {
  generatedCount: number;
  existingCount: number;
  totalSessions: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface UserStats {
  total: number;
  teachers: number;
  students: number;
  parents: number;
  admins: number;
}
