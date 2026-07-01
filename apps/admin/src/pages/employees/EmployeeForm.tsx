import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useEmployee } from "../../features/employees/hooks/use-employee";
import { useCreateEmployee } from "../../features/employees/hooks/use-create-employee";
import { useUpdateEmployee } from "../../features/employees/hooks/use-update-employee";
import { employeeKeys } from "../../features/employees/hooks/query-keys";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const optionalEmail = z
  .string()
  .optional()
  .refine((v) => !v || z.string().email().safeParse(v).success, {
    message: "Email không hợp lệ",
  });

const schema = z.object({
  firstName: z.string().min(1, "Vui lòng nhập họ"),
  lastName: z.string().min(1, "Vui lòng nhập tên"),
  email: optionalEmail,
  phone: z.string().optional(),
  gender: z.union([z.enum(["MALE", "FEMALE", "OTHER"]), z.literal("")]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  employeeType: z.enum([
    "TEACHER",
    "RECEPTIONIST",
    "ACCOUNTANT",
    "ACADEMIC",
    "MANAGER",
    "DIRECTOR",
    "OTHER",
  ]),
  hireDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "RESIGNED"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Shared primitives ────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900",
    "placeholder:text-slate-400 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
    hasError && "border-red-500 focus:ring-red-500"
  );

const selectCls = (hasError?: boolean) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    "disabled:bg-slate-50 disabled:cursor-not-allowed",
    hasError && "border-red-500 focus:ring-red-500"
  );

const textareaCls = (hasError?: boolean) =>
  cn(
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900",
    "placeholder:text-slate-400 resize-none transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    hasError && "border-red-500 focus:ring-red-500"
  );

// ─── Status Options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  {
    value: "ACTIVE",
    label: "Đang làm việc",
    description: "Nhân viên đang làm việc bình thường",
    dot: "bg-green-500",
  },
  {
    value: "ON_LEAVE",
    label: "Nghỉ phép",
    description: "Nhân viên đang trong thời gian nghỉ phép",
    dot: "bg-yellow-500",
  },
  {
    value: "INACTIVE",
    label: "Không hoạt động",
    description: "Tạm ngừng hoạt động",
    dot: "bg-slate-400",
  },
  {
    value: "RESIGNED",
    label: "Đã nghỉ việc",
    description: "Nhân viên đã thôi việc",
    dot: "bg-red-500",
  },
] as const;

// ─── Helper ───────────────────────────────────────────────────────────────────

function toDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

function buildPayload(data: FormData) {
  const empty = (v?: string) => (!v || v.trim() === "" ? undefined : v);
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: empty(data.email),
    phone: empty(data.phone),
    gender: data.gender || undefined,
    dateOfBirth: empty(data.dateOfBirth),
    address: empty(data.address),
    employeeType: data.employeeType,
    hireDate: empty(data.hireDate),
    status: data.status,
    notes: empty(data.notes),
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { emitToast } = useToast();
  const qc = useQueryClient();

  const {
    data: employee,
    isLoading: isFetchingEmployee,
    isError: isEmployeeError,
    refetch: refetchEmployee,
  } = useEmployee(isEdit ? id : undefined);

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(id ?? "");
  const isPending = isEdit ? updateMutation.isPending : createMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "ACTIVE",
      employeeType: "TEACHER",
    },
  });

  const selectedStatus = watch("status");

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        gender: (employee.gender as FormData["gender"]) ?? "",
        dateOfBirth: toDateInput(employee.dateOfBirth),
        address: employee.address ?? "",
        employeeType: employee.employeeType,
        hireDate: toDateInput(employee.hireDate),
        status: employee.status,
        notes: employee.notes ?? "",
      });
    }
  }, [employee, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const payload = buildPayload(data);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      await qc.refetchQueries({ queryKey: employeeKeys.lists(), type: "all" });
      emitToast(isEdit ? "Đã cập nhật nhân viên" : "Đã tạo nhân viên", "success");
      navigate("/employees");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    }
  });

  // Loading state for edit mode
  if (isEdit && isFetchingEmployee) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          <span className="text-sm text-slate-400">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (isEdit && isEmployeeError) {
    return (
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa nhân viên</h2>
          <button
            onClick={() => navigate("/employees")}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">Không thể tải nhân viên</p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => navigate("/employees")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Quay lại danh sách
            </button>
            <button
              onClick={() => refetchEmployee()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/employees")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
        </h1>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-5">
          {/* Employee Code — read only in edit mode */}
          {isEdit && employee?.code && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Mã nhân viên
                </span>
                <span className="font-mono text-lg font-semibold text-slate-900">
                  {employee.code}
                </span>
              </div>
              <span className="ml-2 rounded-lg bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Chỉ đọc
              </span>
            </div>
          )}

          {/* Personal Information */}
          <Section
            title="Thông tin cá nhân"
            description="Họ tên và thông tin liên lạc của nhân viên"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Họ" required error={errors.firstName?.message}>
                <input
                  {...register("firstName")}
                  placeholder="Nguyễn"
                  autoComplete="off"
                  className={inputCls(!!errors.firstName)}
                />
              </Field>

              <Field label="Tên" required error={errors.lastName?.message}>
                <input
                  {...register("lastName")}
                  placeholder="Văn An"
                  autoComplete="off"
                  className={inputCls(!!errors.lastName)}
                />
              </Field>

              <Field label="Giới tính" error={errors.gender?.message}>
                <select {...register("gender")} className={selectCls(!!errors.gender)}>
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </Field>

              <Field label="Ngày sinh" error={errors.dateOfBirth?.message}>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className={inputCls(!!errors.dateOfBirth)}
                />
              </Field>

              <Field label="Số điện thoại" error={errors.phone?.message}>
                <input
                  {...register("phone")}
                  placeholder="0901 234 567"
                  type="tel"
                  className={inputCls(!!errors.phone)}
                />
              </Field>

              <Field label="Email" error={errors.email?.message}>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="nhanvien@email.com"
                  className={inputCls(!!errors.email)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Địa chỉ" error={errors.address?.message}>
                  <textarea
                    {...register("address")}
                    rows={2}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className={textareaCls(!!errors.address)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Employment Information */}
          <Section title="Thông tin công việc" description="Chức vụ và thời gian làm việc">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Chức vụ" required error={errors.employeeType?.message}>
                <select {...register("employeeType")} className={selectCls(!!errors.employeeType)}>
                  <option value="TEACHER">Giáo viên</option>
                  <option value="RECEPTIONIST">Lễ tân</option>
                  <option value="ACCOUNTANT">Kế toán</option>
                  <option value="ACADEMIC">Học vụ</option>
                  <option value="MANAGER">Quản lý</option>
                  <option value="DIRECTOR">Giám đốc</option>
                  <option value="OTHER">Khác</option>
                </select>
              </Field>

              <Field label="Ngày vào làm" error={errors.hireDate?.message}>
                <input
                  type="date"
                  {...register("hireDate")}
                  className={inputCls(!!errors.hireDate)}
                />
              </Field>
            </div>
          </Section>

          {/* Status & Notes */}
          <Section title="Trạng thái & Ghi chú">
            <div className="flex flex-col gap-4">
              <Field label="Trạng thái" required error={errors.status?.message}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                        selectedStatus === opt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        {...register("status")}
                        className="sr-only"
                      />
                      <span className={cn("mt-0.5 h-3 w-3 shrink-0 rounded-full", opt.dot)} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Ghi chú" error={errors.notes?.message}>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Ghi chú thêm về nhân viên..."
                  className={textareaCls(!!errors.notes)}
                />
              </Field>
            </div>
          </Section>

          {/* Footer */}
          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending
                ? isEdit
                  ? "Đang lưu..."
                  : "Đang tạo..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Tạo nhân viên"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
