import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { studentsApi, getData } from "../../api/client";
import { studentKeys } from "./constants";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";
import type { Student } from "../../types";

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
  dateOfBirth: z.string().optional(),
  gender: z.union([z.enum(["MALE", "FEMALE", "OTHER"]), z.literal("")]).optional(),
  phone: z.string().optional(),
  email: optionalEmail,
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: optionalEmail,
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
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

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  {
    value: "ACTIVE",
    label: "Hoạt động",
    description: "Học sinh đang theo học bình thường",
    dot: "bg-green-500",
  },
  {
    value: "INACTIVE",
    label: "Không hoạt động",
    description: "Học sinh tạm ngừng học",
    dot: "bg-slate-400",
  },
  {
    value: "SUSPENDED",
    label: "Bị khoá",
    description: "Học sinh bị đình chỉ tạm thời",
    dot: "bg-red-500",
  },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

function buildPayload(data: FormData) {
  const empty = (v?: string) => (!v || v.trim() === "" ? undefined : v);
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: empty(data.dateOfBirth),
    gender: data.gender || undefined,
    phone: empty(data.phone),
    email: empty(data.email),
    address: empty(data.address),
    guardianName: empty(data.guardianName),
    guardianPhone: empty(data.guardianPhone),
    guardianEmail: empty(data.guardianEmail),
    status: data.status,
    notes: empty(data.notes),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { emitToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "ACTIVE" },
  });

  const selectedStatus = watch("status");

  // Fetch student data for edit mode
  const { data: studentRes, isLoading: isFetching } = useQuery({
    queryKey: studentKeys.detail(id!),
    queryFn: () => studentsApi.getOne(id!),
    enabled: isEdit,
  });

  // Memoize so the object reference is stable between renders — prevents
  // useEffect from firing on every re-render (e.g. when isPending changes).
  const student = useMemo(() => (studentRes ? getData<Student>(studentRes) : null), [studentRes]);

  // Prefill form when data loads
  useEffect(() => {
    if (student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: toDateInput(student.dateOfBirth),
        gender: (student.gender ?? "") as FormData["gender"],
        phone: student.phone ?? "",
        email: student.email ?? "",
        address: student.address ?? "",
        guardianName: student.guardianName ?? "",
        guardianPhone: student.guardianPhone ?? "",
        guardianEmail: student.guardianEmail ?? "",
        status: student.status,
        notes: student.notes ?? "",
      });
    }
  }, [student, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = buildPayload(data);
      return isEdit ? studentsApi.update(id!, payload) : studentsApi.create(payload);
    },
    onSuccess: (response) => {
      if (isEdit) {
        qc.setQueryData(studentKeys.detail(id!), response);
      }
      qc.invalidateQueries({ queryKey: studentKeys.lists() });
      emitToast(isEdit ? "Cập nhật học sinh thành công" : "Tạo học sinh thành công", "success");
      navigate("/students");
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    },
  });

  const isPending = mutation.isPending;

  if (isEdit && isFetching) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          <span className="text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/students")}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa học sinh" : "Thêm học sinh"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isEdit ? `Cập nhật hồ sơ học sinh` : "Tạo hồ sơ học sinh mới"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
        <div className="flex flex-col gap-5">
          {/* ── Student Code (edit mode only) ────────────────────────────────── */}
          {isEdit && student?.code && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Mã học sinh
                </span>
                <span className="font-mono text-lg font-semibold text-slate-900">
                  {student.code}
                </span>
              </div>
              <span className="ml-2 rounded-lg bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Chỉ đọc
              </span>
            </div>
          )}

          {/* ── Personal Information ─────────────────────────────────────────── */}
          <Section title="Thông tin cá nhân" description="Thông tin cơ bản của học sinh">
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

              <Field label="Ngày sinh" error={errors.dateOfBirth?.message}>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className={inputCls(!!errors.dateOfBirth)}
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
                  placeholder="hocsinh@email.com"
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

          {/* ── Guardian Information ─────────────────────────────────────────── */}
          <Section title="Thông tin phụ huynh" description="Liên hệ phụ huynh hoặc người giám hộ">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Họ tên phụ huynh" error={errors.guardianName?.message}>
                <input
                  {...register("guardianName")}
                  placeholder="Nguyễn Văn B"
                  autoComplete="off"
                  className={inputCls(!!errors.guardianName)}
                />
              </Field>

              <Field label="Số điện thoại phụ huynh" error={errors.guardianPhone?.message}>
                <input
                  {...register("guardianPhone")}
                  placeholder="0901 234 567"
                  type="tel"
                  className={inputCls(!!errors.guardianPhone)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Email phụ huynh" error={errors.guardianEmail?.message}>
                  <input
                    type="email"
                    {...register("guardianEmail")}
                    placeholder="phuhuynh@email.com"
                    className={inputCls(!!errors.guardianEmail)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Status ───────────────────────────────────────────────────────── */}
          <Section title="Trạng thái & Ghi chú">
            <div className="flex flex-col gap-4">
              <Field label="Trạng thái" required error={errors.status?.message}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  placeholder="Ghi chú thêm về học sinh..."
                  className={textareaCls(!!errors.notes)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Footer ───────────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate("/students")}
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
                  : "Tạo học sinh"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
