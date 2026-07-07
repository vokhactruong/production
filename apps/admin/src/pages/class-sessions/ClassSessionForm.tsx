import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useClassSession } from "../../features/class-sessions/hooks/use-class-session";
import { useUpdateClassSession } from "../../features/class-sessions/hooks/use-update-class-session";
import { classSessionKeys } from "../../features/class-sessions/hooks/query-keys";
import { useToast } from "../../components/Toast";
import { cn } from "../../utils";
import { CLASS_SESSION_STATUS_CONFIG, CLASS_SESSION_ALLOWED_TRANSITIONS } from "./constants";

// This page is edit-only: ClassSession is generated business data (see
// SchedulingService — Generate Initial Sessions / Sync Missing Sessions).
// Manual adjustments here are limited to date/status/topic/note; classId and
// sessionNumber are never editable.

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    date: z.string().min(1, "Vui lòng chọn ngày học"),
    startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
    endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
    status: z.enum(["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]),
    topic: z.string().max(200).optional(),
    note: z.string().max(1000).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Giờ kết thúc phải sau giờ bắt đầu",
    path: ["endTime"],
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassSessionForm() {
  const { id } = useParams<{ id: string }>();
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
  });

  const {
    data: session,
    isLoading: isFetching,
    isError: isFetchError,
    refetch,
  } = useClassSession(id);
  const updateSession = useUpdateClassSession(id ?? "");

  const backHref = session ? `/classes/${session.classId}` : "/classes";

  useEffect(() => {
    if (session) {
      reset({
        date: session.date.slice(0, 10),
        startTime: session.startTime.slice(11, 16),
        endTime: session.endTime.slice(11, 16),
        status: session.status,
        topic: session.topic ?? "",
        note: session.note ?? "",
      });
    }
  }, [session, reset]);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          <span className="text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (isFetchError || !session) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/classes")}
            className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa buổi học</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Không thể tải thông tin buổi học
          </p>
          <p className="mt-1 text-xs text-slate-400">Vui lòng thử lại hoặc quay về danh sách</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/classes")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Quay lại danh sách lớp học
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

  const statusOptions = [session.status, ...CLASS_SESSION_ALLOWED_TRANSITIONS[session.status]];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(backHref)}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Chỉnh sửa buổi học — Buổi {session.sessionNumber}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {session.class?.name && `Lớp học: ${session.class.name}`}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(async (data) => {
          const payload = {
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            topic: data.topic?.trim() || undefined,
            note: data.note?.trim() || undefined,
          };
          try {
            await updateSession.mutateAsync(payload);
            await qc.refetchQueries({ queryKey: classSessionKeys.lists(), type: "all" });
            emitToast("Cập nhật buổi học thành công", "success");
            navigate(backHref);
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
          {/* ── Schedule ──────────────────────────────────────────────────────── */}
          <Section title="Lịch buổi học" description="Buổi học và số thứ tự không thể thay đổi">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Số buổi học">
                <input value={`Buổi ${session.sessionNumber}`} disabled className={inputCls()} />
              </Field>

              <Field label="Trạng thái" required error={errors.status?.message}>
                <select
                  {...register("status")}
                  className={cn(inputCls(!!errors.status), "cursor-pointer")}
                >
                  {statusOptions.map((value) => (
                    <option key={value} value={value}>
                      {CLASS_SESSION_STATUS_CONFIG[value].label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ngày học" required error={errors.date?.message}>
                <input type="date" {...register("date")} className={inputCls(!!errors.date)} />
              </Field>

              <div />

              <Field label="Giờ bắt đầu" required error={errors.startTime?.message}>
                <input
                  type="time"
                  {...register("startTime")}
                  className={inputCls(!!errors.startTime)}
                />
              </Field>

              <Field label="Giờ kết thúc" required error={errors.endTime?.message}>
                <input
                  type="time"
                  {...register("endTime")}
                  className={inputCls(!!errors.endTime)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <Section title="Nội dung buổi học">
            <div className="flex flex-col gap-4">
              <Field label="Chủ đề" error={errors.topic?.message}>
                <input
                  {...register("topic")}
                  placeholder="VD: Unit 3 - Present Simple"
                  autoComplete="off"
                  className={inputCls(!!errors.topic)}
                />
              </Field>

              <Field label="Ghi chú" error={errors.note?.message}>
                <textarea
                  {...register("note")}
                  rows={3}
                  placeholder="Ghi chú thêm về buổi học (VD: lý do đổi lịch — nghỉ lễ, giáo viên bận, mất điện...)"
                  className={textareaCls(!!errors.note)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate(backHref)}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={updateSession.isPending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateSession.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
