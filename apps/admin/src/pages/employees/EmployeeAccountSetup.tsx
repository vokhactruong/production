import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, UserPlus, Link as LinkIcon, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useEmployee } from "../../features/employees/hooks/use-employee";
import { useLinkEmployeeUser } from "../../features/employees/hooks/use-link-employee-user";
import { useCreateEmployeeUser } from "../../features/employees/hooks/use-create-employee-user";
import { useAvailableUsers } from "../../features/employees/hooks/use-available-users";
import { rolesApi } from "../../features/roles/api/roles.api";
import { roleKeys } from "../../features/roles/hooks/query-keys";
import { getData } from "../../lib/api-client";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";
import { EMPLOYEE_TYPE_CONFIG } from "./constants";
import type { Role } from "../../types";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  roleId: z.string().min(1, "Vui lòng chọn vai trò"),
});

const linkSchema = z.object({
  userId: z.string().min(1, "Vui lòng chọn tài khoản"),
});

type CreateFormData = z.infer<typeof createSchema>;
type LinkFormData = z.infer<typeof linkSchema>;

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900",
    "placeholder:text-slate-400 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    hasError && "border-red-500 focus:ring-red-500"
  );

const selectCls = (hasError?: boolean) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    hasError && "border-red-500 focus:ring-red-500"
  );

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Option Tab ───────────────────────────────────────────────────────────────

type Option = "create" | "link";

// ─── Create Account Form ──────────────────────────────────────────────────────

function CreateAccountForm({
  employeeId,
  onSuccess,
  onCancel,
}: {
  employeeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { emitToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const createMutation = useCreateEmployeeUser(employeeId);

  const { data: rolesRes } = useQuery({
    queryKey: roleKeys.all,
    queryFn: () => rolesApi.getAll(),
  });
  const roles = rolesRes ? getData<Role[]>(rolesRes) : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync(data);
      emitToast("Đã tạo và liên kết tài khoản thành công", "success");
      onSuccess();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Email đăng nhập" error={errors.email?.message}>
        <input
          type="email"
          {...register("email")}
          placeholder="nhanvien@email.com"
          className={inputCls(!!errors.email)}
          autoComplete="off"
        />
      </Field>

      <Field label="Mật khẩu tạm thời" error={errors.password?.message}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Ít nhất 8 ký tự"
            className={cn(inputCls(!!errors.password), "pr-10")}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Field label="Vai trò" error={errors.roleId?.message}>
        <select {...register("roleId")} className={selectCls(!!errors.roleId)}>
          <option value="">Chọn vai trò...</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={createMutation.isPending}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
      </div>
    </form>
  );
}

// ─── Link Existing User Form ──────────────────────────────────────────────────

function LinkUserForm({
  employeeId,
  onSuccess,
  onCancel,
}: {
  employeeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { emitToast } = useToast();
  const linkMutation = useLinkEmployeeUser(employeeId);
  const { data: availableUsers = [], isLoading } = useAvailableUsers();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkFormData>({ resolver: zodResolver(linkSchema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await linkMutation.mutateAsync({ userId: data.userId });
      emitToast("Đã liên kết tài khoản thành công", "success");
      onSuccess();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Chọn tài khoản" error={errors.userId?.message}>
        <select {...register("userId")} className={selectCls(!!errors.userId)} disabled={isLoading}>
          <option value="">{isLoading ? "Đang tải..." : "Chọn tài khoản để liên kết..."}</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.lastName} {u.firstName} — {u.email}
            </option>
          ))}
        </select>
      </Field>
      {!isLoading && availableUsers.length === 0 && (
        <p className="text-xs text-slate-500">
          Không có tài khoản nào khả dụng. Tất cả tài khoản đang hoạt động đều đã được liên kết.
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={linkMutation.isPending}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={linkMutation.isPending || availableUsers.length === 0}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {linkMutation.isPending ? "Đang liên kết..." : "Liên kết"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeAccountSetup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [option, setOption] = useState<Option>("create");

  const { data: employee, isLoading, isError } = useEmployee(id);

  const goToDetail = () => navigate(`/employees/${id}`);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="mx-auto max-w-xl flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm font-semibold text-slate-700">Không thể tải thông tin nhân viên</p>
        <button
          onClick={() => navigate("/employees")}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (employee.user) {
    return (
      <div className="mx-auto max-w-xl flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-slate-600">Nhân viên này đã có tài khoản đăng nhập.</p>
        <button
          onClick={goToDetail}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Xem chi tiết nhân viên
        </button>
      </div>
    );
  }

  const typeCfg = EMPLOYEE_TYPE_CONFIG[employee.employeeType];

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={goToDetail}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thiết lập tài khoản đăng nhập</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {employee.lastName} {employee.firstName} ·{" "}
            <span className="font-mono text-xs">{employee.code}</span> ·{" "}
            <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", typeCfg.cls)}>
              {typeCfg.label}
            </span>
          </p>
        </div>
      </div>

      {/* Option Selector */}
      <div className="mb-5 flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setOption("create")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            option === "create"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <UserPlus className="h-4 w-4" />
          Tạo tài khoản mới
        </button>
        <button
          type="button"
          onClick={() => setOption("link")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            option === "link"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <LinkIcon className="h-4 w-4" />
          Liên kết tài khoản
        </button>
      </div>

      {/* Form Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {option === "create" ? "Tạo tài khoản đăng nhập mới" : "Liên kết tài khoản hiện có"}
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          {option === "create"
            ? "Tạo một tài khoản mới và liên kết ngay với nhân viên này. Tên hiển thị sẽ lấy từ hồ sơ nhân viên."
            : "Chọn một tài khoản đang hoạt động chưa được liên kết với nhân viên nào."}
        </p>

        {option === "create" ? (
          <CreateAccountForm employeeId={id ?? ""} onSuccess={goToDetail} onCancel={goToDetail} />
        ) : (
          <LinkUserForm employeeId={id ?? ""} onSuccess={goToDetail} onCancel={goToDetail} />
        )}
      </div>

      {/* Skip */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={goToDetail}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Bỏ qua, thiết lập sau →
        </button>
      </div>
    </div>
  );
}
