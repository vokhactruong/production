import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useCourse } from "../../features/courses/hooks/use-course";
import { useCreateCourse } from "../../features/courses/hooks/use-create-course";
import { useUpdateCourse } from "../../features/courses/hooks/use-update-course";
import { courseKeys } from "../../features/courses/hooks/query-keys";
import { useSubjects } from "../../features/subjects/hooks/use-subjects";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  subjectId: z.string().min(1, "Vui lòng chọn môn học"),
  code: z.string().min(1, "Vui lòng nhập mã khóa học").max(50, "Mã không được quá 50 ký tự"),
  name: z.string().min(1, "Vui lòng nhập tên khóa học").max(200, "Tên không được quá 200 ký tự"),
  description: z.string().max(1000).optional(),
  courseType: z.enum(["NORMAL", "TRIAL"]),
  packageLessons: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập số buổi học" })
    .int("Phải là số nguyên")
    .positive("Số buổi học phải lớn hơn 0"),
  lessonDuration: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập thời lượng" })
    .int("Phải là số nguyên")
    .positive("Thời lượng phải lớn hơn 0"),
  basePrice: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập học phí" })
    .positive("Học phí phải lớn hơn 0"),
  displayOrder: z.coerce.number().int().min(0).optional(),
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

const COURSE_TYPE_OPTIONS = [
  {
    value: "NORMAL" as const,
    label: "Thường",
    description: "Khóa học tiêu chuẩn",
    dot: "bg-blue-500",
  },
  {
    value: "TRIAL" as const,
    label: "Thử nghiệm",
    description: "Khóa học dùng thử",
    dot: "bg-amber-500",
  },
];

const STATUS_OPTIONS = [
  {
    value: "ACTIVE" as const,
    label: "Hoạt động",
    description: "Khóa học đang mở",
    dot: "bg-green-500",
  },
  {
    value: "INACTIVE" as const,
    label: "Không hoạt động",
    description: "Khóa học tạm ngừng",
    dot: "bg-slate-400",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseForm() {
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
    defaultValues: { status: "ACTIVE", courseType: "NORMAL", displayOrder: 0 },
  });

  const selectedStatus = watch("status");
  const selectedCourseType = watch("courseType");

  const {
    data: course,
    isLoading: isFetching,
    isError: isFetchError,
    refetch,
  } = useCourse(isEdit ? id : undefined);

  const { data: subjectsData } = useSubjects({ page: 1 });

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(id ?? "");
  const isPending = createCourse.isPending || updateCourse.isPending;

  useEffect(() => {
    if (course) {
      reset({
        subjectId: course.subjectId,
        code: course.code,
        name: course.name,
        description: course.description ?? "",
        courseType: course.courseType,
        packageLessons: course.packageLessons,
        lessonDuration: course.lessonDuration,
        basePrice: Number(course.basePrice),
        displayOrder: course.displayOrder,
        status: course.status,
      });
    }
  }, [course, reset]);

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
            onClick={() => navigate("/courses")}
            className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa khóa học</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Không thể tải thông tin khóa học
          </p>
          <p className="mt-1 text-xs text-slate-400">Vui lòng thử lại hoặc quay về danh sách</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/courses")}
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
          onClick={() => navigate("/courses")}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa khóa học" : "Thêm khóa học"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isEdit ? "Cập nhật thông tin khóa học" : "Tạo khóa học mới"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(async (data) => {
          const payload = {
            subjectId: data.subjectId,
            code: data.code,
            name: data.name,
            description: data.description?.trim() || undefined,
            courseType: data.courseType,
            packageLessons: data.packageLessons,
            lessonDuration: data.lessonDuration,
            basePrice: data.basePrice,
            displayOrder: data.displayOrder ?? 0,
            status: data.status,
          };
          try {
            if (isEdit) {
              const { subjectId: _s, code: _c, ...updatePayload } = payload;
              await updateCourse.mutateAsync(updatePayload);
            } else {
              await createCourse.mutateAsync(payload);
            }
            await qc.refetchQueries({ queryKey: courseKeys.lists(), type: "all" });
            emitToast(
              isEdit ? "Cập nhật khóa học thành công" : "Tạo khóa học thành công",
              "success"
            );
            navigate("/courses");
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
          <Section title="Thông tin khóa học" description="Môn học, mã và tên khóa học">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Môn học" required error={errors.subjectId?.message}>
                <select
                  {...register("subjectId")}
                  disabled={isEdit}
                  className={cn(inputCls(!!errors.subjectId), "cursor-pointer")}
                >
                  <option value="">Chọn môn học...</option>
                  {subjectsData?.items
                    .filter((s) => s.status === "ACTIVE")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                {isEdit && (
                  <p className="text-xs text-slate-400">Môn học không thể thay đổi sau khi tạo</p>
                )}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mã khóa học" required error={errors.code?.message}>
                  <input
                    {...register("code")}
                    placeholder="VD: IELTS-55, TOEIC-700"
                    autoComplete="off"
                    disabled={isEdit}
                    className={inputCls(!!errors.code)}
                  />
                  {isEdit && (
                    <p className="text-xs text-slate-400">
                      Mã khóa học không thể thay đổi sau khi tạo
                    </p>
                  )}
                </Field>

                <Field label="Tên khóa học" required error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="VD: IELTS 5.5"
                    autoComplete="off"
                    className={inputCls(!!errors.name)}
                  />
                </Field>
              </div>

              <Field label="Mô tả" error={errors.description?.message}>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Mô tả ngắn về khóa học..."
                  className={textareaCls(!!errors.description)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Course Specs ─────────────────────────────────────────────────── */}
          <Section title="Thông số khóa học" description="Số buổi, thời lượng và học phí cơ bản">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Số buổi học (gói)" required error={errors.packageLessons?.message}>
                <input
                  {...register("packageLessons")}
                  type="number"
                  min={1}
                  placeholder="VD: 15"
                  className={inputCls(!!errors.packageLessons)}
                />
              </Field>

              <Field
                label="Thời lượng mỗi buổi (phút)"
                required
                error={errors.lessonDuration?.message}
              >
                <input
                  {...register("lessonDuration")}
                  type="number"
                  min={1}
                  placeholder="VD: 90"
                  className={inputCls(!!errors.lessonDuration)}
                />
              </Field>

              <Field label="Học phí cơ bản (VNĐ)" required error={errors.basePrice?.message}>
                <input
                  {...register("basePrice")}
                  type="number"
                  min={1}
                  placeholder="VD: 4500000"
                  className={inputCls(!!errors.basePrice)}
                />
              </Field>

              <Field label="Thứ tự hiển thị" error={errors.displayOrder?.message}>
                <input
                  {...register("displayOrder")}
                  type="number"
                  min={0}
                  placeholder="0"
                  className={inputCls(!!errors.displayOrder)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Course Type ──────────────────────────────────────────────────── */}
          <Section title="Loại khóa học">
            <Field label="Loại khóa học" required error={errors.courseType?.message}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {COURSE_TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                      selectedCourseType === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("courseType")}
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
              onClick={() => navigate("/courses")}
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
                  : "Tạo khóa học"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
