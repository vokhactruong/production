import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useSubject } from "../../features/subjects/hooks/use-subject";
import { useCreateSubject } from "../../features/subjects/hooks/use-create-subject";
import { useUpdateSubject } from "../../features/subjects/hooks/use-update-subject";
import { subjectKeys } from "../../features/subjects/hooks/query-keys";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã môn học").max(50, "Mã không được quá 50 ký tự"),
  name: z.string().min(1, "Vui lòng nhập tên môn học").max(200, "Tên không được quá 200 ký tự"),
  description: z.string().max(1000).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
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

const textareaCls = (hasError?: boolean) =>
  cn(
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900",
    "placeholder:text-slate-400 resize-none transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    hasError && "border-red-500 focus:ring-red-500"
  );

const STATUS_OPTIONS = [
  {
    value: "ACTIVE",
    label: "Hoạt động",
    description: "Môn học đang được giảng dạy",
    dot: "bg-green-500",
  },
  {
    value: "INACTIVE",
    label: "Không hoạt động",
    description: "Môn học tạm ngừng",
    dot: "bg-slate-400",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubjectForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { emitToast } = useToast();
  const qc = useQueryClient();

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

  const {
    data: subject,
    isLoading: isFetching,
    isError: isFetchError,
    refetch,
  } = useSubject(isEdit ? id : undefined);
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject(id ?? "");

  const isPending = createSubject.isPending || updateSubject.isPending;

  useEffect(() => {
    if (subject) {
      reset({
        code: subject.code,
        name: subject.name,
        description: subject.description ?? "",
        color: subject.color ?? "",
        icon: subject.icon ?? "",
        status: subject.status,
      });
    }
  }, [subject, reset]);

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
            onClick={() => navigate("/subjects")}
            className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa môn học</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Không thể tải thông tin môn học
          </p>
          <p className="mt-1 text-xs text-slate-400">Vui lòng thử lại hoặc quay về danh sách</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/subjects")}
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

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/subjects")}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa môn học" : "Thêm môn học"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isEdit ? "Cập nhật thông tin môn học" : "Tạo môn học mới"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(async (data) => {
          const empty = (v?: string) => (!v || v.trim() === "" ? undefined : v);
          const payload = {
            code: data.code,
            name: data.name,
            description: empty(data.description),
            color: empty(data.color),
            icon: empty(data.icon),
            status: data.status,
          };
          try {
            if (isEdit) {
              const { code: _c, ...updatePayload } = payload;
              await updateSubject.mutateAsync(updatePayload);
            } else {
              await createSubject.mutateAsync(payload);
            }
            await qc.refetchQueries({ queryKey: subjectKeys.lists(), type: "all" });
            emitToast(isEdit ? "Cập nhật môn học thành công" : "Tạo môn học thành công", "success");
            navigate("/subjects");
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
          {/* ── Basic Information ────────────────────────────────────────────── */}
          <Section title="Thông tin môn học" description="Mã và tên môn học">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mã môn học" required error={errors.code?.message}>
                <input
                  {...register("code")}
                  placeholder="VD: TOAN, ANH, LY"
                  autoComplete="off"
                  disabled={isEdit}
                  className={inputCls(!!errors.code)}
                />
                {isEdit && (
                  <p className="text-xs text-slate-400">
                    Mã môn học không thể thay đổi sau khi tạo
                  </p>
                )}
              </Field>

              <Field label="Tên môn học" required error={errors.name?.message}>
                <input
                  {...register("name")}
                  placeholder="VD: Toán học, Tiếng Anh"
                  autoComplete="off"
                  className={inputCls(!!errors.name)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Mô tả" error={errors.description?.message}>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Mô tả ngắn về môn học..."
                    className={textareaCls(!!errors.description)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Visual ──────────────────────────────────────────────────────── */}
          <Section title="Hiển thị" description="Màu sắc và biểu tượng (tuỳ chọn)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Màu sắc" error={errors.color?.message}>
                <input
                  {...register("color")}
                  placeholder="#6366f1 hoặc tên màu"
                  className={inputCls(!!errors.color)}
                />
              </Field>
              <Field label="Biểu tượng (emoji)" error={errors.icon?.message}>
                <input
                  {...register("icon")}
                  placeholder="📚 hoặc tên icon"
                  className={inputCls(!!errors.icon)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Status ──────────────────────────────────────────────────────── */}
          <Section title="Trạng thái">
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
          </Section>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate("/subjects")}
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
                  : "Tạo môn học"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
