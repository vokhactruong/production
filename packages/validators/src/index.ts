import { z } from "zod";

// ─── Auth Schemas ──────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Cần ít nhất 1 số")
    .regex(/[^A-Za-z0-9]/, "Cần ít nhất 1 ký tự đặc biệt"),
  firstName: z.string().min(1, "Họ không được để trống").max(50),
  lastName: z.string().min(1, "Tên không được để trống").max(50),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Cần ít nhất 1 số")
    .regex(/[^A-Za-z0-9]/, "Cần ít nhất 1 ký tự đặc biệt"),
});

// ─── User Schemas ─────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  roleIds: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  roleIds: z.array(z.string()).optional(),
});

// ─── Role Schemas ─────────────────────────────────────────────────────────────

export const CreateRoleSchema = z.object({
  name: z.string().min(1, "Tên vai trò không được để trống").max(100),
  description: z.string().max(500).optional(),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const AssignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()).min(1, "Phải chọn ít nhất 1 permission"),
});

// ─── Category Schemas ─────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống").max(100),
  description: z.string().max(500).optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

// ─── Article Schemas ──────────────────────────────────────────────────────────

export const CreateArticleSchema = z.object({
  title: z.string().min(3, "Tiêu đề tối thiểu 3 ký tự").max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, "Nội dung không được để trống"),
  thumbnail: z.string().url().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const UpdateArticleSchema = CreateArticleSchema.partial();

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
