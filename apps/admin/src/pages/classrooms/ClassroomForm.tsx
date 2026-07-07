import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useClassroom } from "../../features/classrooms/hooks/use-classroom";
import { useCreateClassroom } from "../../features/classrooms/hooks/use-create-classroom";
import { useUpdateClassroom } from "../../features/classrooms/hooks/use-update-classroom";
import { classroomKeys } from "../../features/classrooms/hooks/query-keys";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã phòng học").max(50, "Mã không được quá 50 ký tự"),
  name: z.string().min(1, "Vui lòng nhập tên phòng học").max(200, "Tên không được quá 200 ký tự"),
  type: z.enum(["PHYSICAL", "ONLINE", "LAB"]),
  capacity: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập sức chứa" })
    .int("Phải là số nguyên")
    .positive("Sức chứa phải lớn hơn 0"),
  description: z.string().max(1000).optional(),
  isActive: z.enum(["true", "false"]),
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

const TYPE_OPTIONS = [
  {
    value: "PHYSICAL" as const,
    label: "Phòng vật lý",
    description: "Phòng học trực tiếp",
    dot: "bg-blue-500",
  },
  {
    value: "ONLINE" as const,
    label: "Phòng trực tuyến",
    description: "Phòng học qua Zoom/Meet",
    dot: "bg-purple-500",
  },
  {
    value: "LAB" as const,
    label: "Phòng thí nghiệm",
    description: "Phòng thực hành, STEM",
    dot: "bg-amber-500",
  },
];

const STATUS_OPTIONS = [
  {
    value: "true" as const,
    label: "Hoạt động",
    description: "Có thể gán cho lớp học mới",
    dot: "bg-green-500",
  },
  {
    value: "false" as const,
    label: "Không hoạt động",
    description: "Tạm ngừng sử dụng",
    dot: "bg-slate-400",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassroomForm() {
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
    defaultValues: { type: "PHYSICAL", isActive: "true" },
  });

  const selectedType = watch("type");
  const selectedActive = watch("isActive");

  const {
    data: classroom,
    isLoading: isFetching,
    isError: isFetchError,
    refetch,
  } = useClassroom(isEdit ? id : undefined);

  const createClassroom = useCreateClassroom();
  const updateClassroom = useUpdateClassroom(id ?? "");
  const isPending = createClassroom.isPending || updateClassroom.isPending;

  useEffect(() => {
    if (classroom) {
      reset({
        code: classroom.code,
        name: classroom.name,
        type: classroom.type,
        capacity: classroom.capacity,
        description: classroom.description ?? "",
        isActive: classroom.isActive ? "true" : "false",
      });
    }
  }, [classroom, reset]);

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
            onClick={() => navigate("/classrooms")}
            className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa phòng học</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Không thể tải thông tin phòng học
          </p>
          <p className="mt-1 text-xs text-slate-400">Vui lòng thử lại hoặc quay về danh sách</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/classrooms")}
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
          onClick={() => navigate("/classrooms")}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa phòng học" : "Thêm phòng học"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isEdit ? "Cập nhật thông tin phòng học" : "Tạo phòng học mới"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(async (data) => {
          const payload = {
            code: data.code,
            name: data.name,
            type: data.type,
            capacity: data.capacity,
            description: data.description?.trim() || undefined,
            isActive: data.isActive === "true",
          };
          try {
            if (isEdit) {
              const { code: _c, ...updatePayload } = payload;
              await updateClassroom.mutateAsync(updatePayload);
            } else {
              await createClassroom.mutateAsync(payload);
            }
            await qc.refetchQueries({ queryKey: classroomKeys.lists(), type: "all" });
            emitToast(
              isEdit ? "Cập nhật phòng học thành công" : "Tạo phòng học thành công",
              "success"
            );
            navigate("/classrooms");
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
          <Section title="Thông tin phòng học" description="Mã và tên phòng học">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mã phòng học" required error={errors.code?.message}>
                  <input
                    {...register("code")}
                    placeholder="VD: A101, ZOOM-01"
                    autoComplete="off"
                    disabled={isEdit}
                    className={inputCls(!!errors.code)}
                  />
                  {isEdit && (
                    <p className="text-xs text-slate-400">
                      Mã phòng học không thể thay đổi sau khi tạo
                    </p>
                  )}
                </Field>

                <Field label="Tên phòng học" required error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="VD: Phòng A101"
                    autoComplete="off"
                    className={inputCls(!!errors.name)}
                  />
                </Field>
              </div>

              <Field label="Sức chứa" required error={errors.capacity?.message}>
                <input
                  {...register("capacity")}
                  type="number"
                  min={1}
                  placeholder="VD: 30"
                  className={inputCls(!!errors.capacity)}
                />
              </Field>

              <Field label="Mô tả" error={errors.description?.message}>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Mô tả ngắn về phòng học..."
                  className={textareaCls(!!errors.description)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Type ─────────────────────────────────────────────────────────── */}
          <Section title="Loại phòng học">
            <Field label="Loại phòng học" required error={errors.type?.message}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                      selectedType === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("type")}
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

          {/* ── Status ──────────────────────────────────────────────────────── */}
          <Section title="Trạng thái">
            <Field label="Trạng thái" required error={errors.isActive?.message}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                      selectedActive === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("isActive")}
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
              onClick={() => navigate("/classrooms")}
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
                  : "Tạo phòng học"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
