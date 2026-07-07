import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useEnrollment } from "../../features/enrollments/hooks/use-enrollment";
import { useCreateEnrollment } from "../../features/enrollments/hooks/use-create-enrollment";
import { useUpdateEnrollment } from "../../features/enrollments/hooks/use-update-enrollment";
import { enrollmentKeys } from "../../features/enrollments/hooks/query-keys";
import { useStudents } from "../../features/students/hooks/use-students";
import { useClasses } from "../../features/classes/hooks/use-classes";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";
import { ENROLLMENT_STATUS_CONFIG } from "./constants";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  studentId: z.string().min(1, "Vui lòng chọn học sinh"),
  classId: z.string().min(1, "Vui lòng chọn lớp học"),
  status: z.enum(["PENDING", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]),
  joinedAt: z.string().min(1, "Vui lòng chọn ngày tham gia"),
  note: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

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

const textareaCls = (hasError?: boolean) =>
  cn(
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900",
    "placeholder:text-slate-400 resize-none transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    hasError && "border-red-500 focus:ring-red-500"
  );

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnrollmentForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { emitToast } = useToast();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "ACTIVE", joinedAt: todayIso() },
  });

  const {
    data: enrollment,
    isLoading: isFetching,
    isError: isFetchError,
    refetch,
  } = useEnrollment(isEdit ? id : undefined);

  const { data: studentsData } = useStudents({ page: 1 });
  const { data: classesData } = useClasses({ page: 1 });

  const createEnrollment = useCreateEnrollment();
  const updateEnrollment = useUpdateEnrollment(id ?? "");
  const isPending = createEnrollment.isPending || updateEnrollment.isPending;

  useEffect(() => {
    if (enrollment) {
      reset({
        studentId: enrollment.studentId,
        classId: enrollment.classId,
        status: enrollment.status,
        joinedAt: enrollment.joinedAt.slice(0, 10),
        note: enrollment.note ?? "",
      });
    }
  }, [enrollment, reset]);

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

  if (isEdit && isFetchError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/enrollments")}
            className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa đăng ký học</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Không thể tải thông tin đăng ký học
          </p>
          <p className="mt-1 text-xs text-slate-400">Vui lòng thử lại hoặc quay về danh sách</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/enrollments")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Quay lại danh sách
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeStudents = studentsData?.items.filter((s) => s.status === "ACTIVE") ?? [];
  const activeClasses =
    classesData?.items.filter(
      (c) => c.isActive && c.status !== "COMPLETED" && c.status !== "CANCELLED"
    ) ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/enrollments")}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa đăng ký học" : "Thêm đăng ký học"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isEdit ? "Cập nhật thông tin đăng ký học" : "Đăng ký học sinh vào lớp học"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(async (data) => {
          const payload = {
            classId: data.classId,
            status: data.status,
            joinedAt: data.joinedAt,
            note: data.note?.trim() || undefined,
          };
          try {
            if (isEdit) {
              await updateEnrollment.mutateAsync(payload);
            } else {
              await createEnrollment.mutateAsync({ ...payload, studentId: data.studentId });
            }
            await qc.refetchQueries({ queryKey: enrollmentKeys.lists(), type: "all" });
            emitToast(
              isEdit ? "Cập nhật đăng ký học thành công" : "Tạo đăng ký học thành công",
              "success"
            );
            navigate("/enrollments");
          } catch (err) {
            const msg = axios.isAxiosError(err)
              ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
              : "Có lỗi xảy ra";
            emitToast(msg, "error");
          }
        })}
        noValidate
      >
        <div className="flex flex-col gap-5">
          {/* ── Registration ──────────────────────────────────────────────────── */}
          <Section title="Thông tin đăng ký" description="Học sinh và lớp học">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Học sinh" required error={errors.studentId?.message}>
                <select
                  {...register("studentId")}
                  disabled={isEdit}
                  className={cn(inputCls(!!errors.studentId), "cursor-pointer")}
                >
                  <option value="">Chọn học sinh...</option>
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
                {isEdit && (
                  <p className="text-xs text-slate-400">
                    Học sinh không thể thay đổi. Nếu chọn sai, hãy hủy đăng ký này và tạo đăng ký
                    mới.
                  </p>
                )}
              </Field>

              <Field label="Lớp học" required error={errors.classId?.message}>
                <select
                  {...register("classId")}
                  className={cn(inputCls(!!errors.classId), "cursor-pointer")}
                >
                  <option value="">Chọn lớp học...</option>
                  {activeClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ngày tham gia" required error={errors.joinedAt?.message}>
                <input
                  type="date"
                  {...register("joinedAt")}
                  className={inputCls(!!errors.joinedAt)}
                />
              </Field>

              <Field label="Trạng thái" required error={errors.status?.message}>
                <select
                  {...register("status")}
                  className={cn(inputCls(!!errors.status), "cursor-pointer")}
                >
                  {Object.entries(ENROLLMENT_STATUS_CONFIG).map(([value, cfg]) => (
                    <option key={value} value={value}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Note ────────────────────────────────────────────────────────── */}
          <Section title="Ghi chú">
            <Field label="Ghi chú" error={errors.note?.message}>
              <textarea
                {...register("note")}
                rows={3}
                placeholder="Ghi chú thêm về đăng ký học..."
                className={textareaCls(!!errors.note)}
              />
            </Field>
          </Section>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate("/enrollments")}
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
                  : "Tạo đăng ký"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
