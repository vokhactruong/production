import { useState, useCallback, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardCheck, Pencil, X } from "lucide-react";
import axios from "axios";
import { useAttendanceList } from "../features/attendance/hooks/use-attendance-list";
import { useCorrectAttendance } from "../features/attendance/hooks/use-correct-attendance";
import { useStudents } from "../features/students/hooks/use-students";
import { useClasses } from "../features/classes/hooks/use-classes";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/auth.store";
import { PERMISSIONS } from "../constants/permissions";
import { cn, formatDate, formatDateTime } from "../utils";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_CONFIG,
  isPastCorrectionWindow,
} from "./attendance/constants";
import type { Attendance, AttendanceStatus } from "../types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-32 rounded-md bg-slate-200" />
          <div className="h-3 w-20 rounded-md bg-slate-200" />
        </div>
      </td>
      <td className="hidden px-4 py-3.5 sm:table-cell">
        <div className="h-3.5 w-28 rounded-md bg-slate-200" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-5 w-20 rounded-lg bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3.5 md:table-cell">
        <div className="h-3.5 w-24 rounded-md bg-slate-200" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end gap-1.5">
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
        </div>
      </td>
    </tr>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, "…", totalPages);
  } else if (page >= totalPages - 3) {
    pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);
  }

  return (
    <div className="flex items-center justify-between gap-4 px-1">
      <p className="text-xs text-slate-400">
        {from}–{to} / {total} lượt điểm danh
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                page === p
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Correction dialog ────────────────────────────────────────────────────────
// PATCH /attendance/:id — status/note only. The 48h window and the
// `attendance.correct` requirement are enforced by the API; failures surface
// their message verbatim.

function CorrectionDialog({ row, onClose }: { row: Attendance; onClose: () => void }) {
  const { emitToast } = useToast();
  const correctMutation = useCorrectAttendance();
  const [status, setStatus] = useState<AttendanceStatus>(row.status);
  const [note, setNote] = useState(row.note ?? "");

  const isDirty = status !== row.status || note !== (row.note ?? "");
  const studentName = row.enrollment?.student
    ? `${row.enrollment.student.firstName} ${row.enrollment.student.lastName}`
    : "—";

  const handleSave = async () => {
    try {
      await correctMutation.mutateAsync({
        id: row.id,
        data: {
          ...(status !== row.status && { status }),
          ...(note !== (row.note ?? "") && { note }),
        },
      });
      emitToast("Đã sửa điểm danh", "success");
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!correctMutation.isPending ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="correction-dialog-title"
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 rounded-t-2xl bg-blue-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Pencil className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 id="correction-dialog-title" className="text-sm font-semibold text-slate-900">
              Sửa điểm danh
            </h3>
            <p className="truncate text-xs text-slate-500">
              {studentName}
              {row.classSession && ` · Buổi ${row.classSession.sessionNumber}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Trạng thái</span>
            <div
              role="radiogroup"
              aria-label="Trạng thái điểm danh"
              className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
            >
              {ATTENDANCE_STATUSES.map((s) => {
                const cfg = ATTENDANCE_STATUS_CONFIG[s];
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                      isActive
                        ? cfg.activeCls
                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="correction-note" className="text-sm font-medium text-slate-700">
              Ghi chú
            </label>
            <textarea
              id="correction-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Lý do sửa hoặc ghi chú thêm..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2.5 px-5 pb-5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={correctMutation.isPending}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || correctMutation.isPending}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {correctMutation.isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Row ───────────────────────────────────────────────────────────

interface AttendanceRowProps {
  row: Attendance;
  canEditRow: (row: Attendance) => boolean;
  onEdit: (row: Attendance) => void;
}

const AttendanceRow = memo(function AttendanceRow({ row, canEditRow, onEdit }: AttendanceRowProps) {
  const cfg = ATTENDANCE_STATUS_CONFIG[row.status];
  const studentName = row.enrollment?.student
    ? `${row.enrollment.student.firstName} ${row.enrollment.student.lastName}`
    : "—";
  const pastWindow = row.classSession ? isPastCorrectionWindow(row.classSession) : false;
  return (
    <tr className="group hover:bg-blue-50/40 transition-colors">
      {/* Student */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{studentName}</p>
            <span className="font-mono text-xs text-slate-400">
              {row.enrollment?.student?.code ?? "—"}
            </span>
          </div>
        </div>
      </td>

      {/* Session */}
      <td className="hidden px-4 py-3.5 sm:table-cell">
        {row.classSession ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-slate-600">
              Buổi {row.classSession.sessionNumber} · {formatDate(row.classSession.date)}
            </span>
            {pastWindow && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                Quá hạn 48h
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
            cfg.cls
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
          {cfg.label}
        </span>
      </td>

      {/* Marked by */}
      <td className="hidden px-4 py-3.5 md:table-cell">
        <p className="text-sm text-slate-600">
          {row.markedBy ? `${row.markedBy.firstName} ${row.markedBy.lastName}` : "—"}
        </p>
        <span className="text-xs text-slate-400">{formatDateTime(row.updatedAt)}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-0.5">
          {canEditRow(row) && (
            <button
              onClick={() => onEdit(row)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              aria-label={`Sửa điểm danh của ${studentName}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const classId = searchParams.get("classId") ?? "";
  const studentId = searchParams.get("studentId") ?? "";
  const status = searchParams.get("status") ?? "";
  const classSessionId = searchParams.get("classSessionId") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [editRow, setEditRow] = useState<Attendance | null>(null);

  const {
    data: attendanceData,
    isLoading,
    isError,
  } = useAttendanceList({ classSessionId, classId, studentId, status, page });
  const { data: studentsData } = useStudents({ page: 1 });
  const { data: classesData } = useClasses({ page: 1 });
  const isFiltered = Boolean(classId || studentId || status || classSessionId);

  const setFilter = (key: string, val: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (val) next.set(key, val);
        else next.delete(key);
        next.delete("page");
        return next;
      },
      { replace: true }
    );
  };

  // Correction affordance (UI hint only — the backend is authoritative):
  // within 48h of the session end `attendance.update` suffices; beyond that,
  // only holders of `attendance.correct` see the affordance.
  const canEditRow = useCallback(
    (row: Attendance) => {
      if (!hasPermission(PERMISSIONS.ATTENDANCE_UPDATE)) return false;
      const pastWindow = row.classSession ? isPastCorrectionWindow(row.classSession) : false;
      return !pastWindow || hasPermission(PERMISSIONS.ATTENDANCE_CORRECT);
    },
    [hasPermission]
  );

  const handleEdit = useCallback((row: Attendance) => setEditRow(row), []);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Điểm danh</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isLoading ? (
              <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200" />
            ) : (
              `${attendanceData?.meta.total ?? 0} lượt điểm danh`
            )}
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <select
          value={classId}
          onChange={(e) => setFilter("classId", e.target.value)}
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">Tất cả lớp học</option>
          {classesData?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={studentId}
          onChange={(e) => setFilter("studentId", e.target.value)}
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">Tất cả học sinh</option>
          {studentsData?.items.map((s) => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setFilter("status", e.target.value)}
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">Tất cả trạng thái</option>
          {ATTENDANCE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ATTENDANCE_STATUS_CONFIG[value].label}
            </option>
          ))}
        </select>
        {classSessionId && (
          <button
            onClick={() => setFilter("classSessionId", "")}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Đang lọc theo buổi học
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Học sinh
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                  Buổi học
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  Người điểm danh
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Không thể tải dữ liệu</p>
                        <p className="mt-0.5 text-xs text-slate-400">Vui lòng thử lại sau</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : attendanceData?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <ClipboardCheck className="h-7 w-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {isFiltered ? "Không tìm thấy kết quả" : "Chưa có lượt điểm danh nào"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {isFiltered
                            ? "Thử thay đổi bộ lọc"
                            : "Điểm danh từ trang chi tiết lớp học để bắt đầu"}
                        </p>
                      </div>
                      {isFiltered && (
                        <button
                          onClick={() => setSearchParams({}, { replace: true })}
                          className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Xoá bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                attendanceData?.items.map((row) => (
                  <AttendanceRow
                    key={row.id}
                    row={row}
                    canEditRow={canEditRow}
                    onEdit={handleEdit}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {attendanceData && attendanceData.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={attendanceData.meta.totalPages}
          total={attendanceData.meta.total}
          limit={10}
          onPageChange={(p) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (p > 1) next.set("page", String(p));
              else next.delete("page");
              return next;
            })
          }
        />
      )}

      {/* ── Correction dialog ───────────────────────────────────────────────── */}
      {editRow && <CorrectionDialog row={editRow} onClose={() => setEditRow(null)} />}
    </div>
  );
}
