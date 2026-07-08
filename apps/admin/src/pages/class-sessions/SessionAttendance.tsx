import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  AlertCircle,
  CheckCheck,
  ClipboardCheck,
  GraduationCap,
  Info,
} from "lucide-react";
import { useClassSession } from "../../features/class-sessions/hooks/use-class-session";
import { useUpdateClassSession } from "../../features/class-sessions/hooks/use-update-class-session";
import { classSessionKeys } from "../../features/class-sessions/hooks/query-keys";
import { useEnrollments } from "../../features/enrollments/hooks/use-enrollments";
import { enrollmentKeys } from "../../features/enrollments/hooks/query-keys";
import { useSessionAttendance } from "../../features/attendance/hooks/use-session-attendance";
import { useRecordAttendance } from "../../features/attendance/hooks/use-record-attendance";
import Can from "../../components/Can";
import { useToast } from "../../components/Toast";
import { useAuthStore } from "../../store/auth.store";
import { PERMISSIONS } from "../../constants/permissions";
import { cn, formatDate, formatTime } from "../../utils";
import { CLASS_SESSION_STATUS_CONFIG } from "./constants";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_CONFIG,
  isPastCorrectionWindow,
} from "../attendance/constants";
import type { Attendance, AttendanceStatus, ClassSession, Enrollment } from "../../types";

// Recording rules mirror the approved D4 writable-status matrix — the backend
// stays authoritative, the UI just avoids offering actions the API rejects:
//   PLANNED   → read-only (session hasn't started; no pre-marking)
//   ONGOING   → create + update (bulk save)
//   COMPLETED → update EXISTING rows only, never new rows (mid-cycle backfill
//               is deliberately impossible — Slice #2 boundary)
//   CANCELLED → read-only

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err)
    ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
    : "Có lỗi xảy ra";
}

function Notice({ tone, children }: { tone: "info" | "warning"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
        tone === "info"
          ? "border-blue-100 bg-blue-50 text-blue-700"
          : "border-amber-100 bg-amber-50 text-amber-700"
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function RosterSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-200" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-36 rounded bg-slate-200" />
                <div className="h-3 w-20 rounded bg-slate-200" />
              </div>
            </div>
            <div className="h-9 w-64 rounded-xl bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Roster + recording (mounted only once the session is loaded) ─────────────

function AttendanceRoster({ session }: { session: ClassSession }) {
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const {
    data: rosterData,
    isLoading: isRosterLoading,
    isError: isRosterError,
  } = useEnrollments({ classId: session.classId, status: "ACTIVE", page: 1, limit: 100 });
  const {
    data: attendanceData,
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
  } = useSessionAttendance(session.id);

  const recordMutation = useRecordAttendance(session.id);
  const completeMutation = useUpdateClassSession(session.id);

  // Draft statuses keyed by enrollmentId — initialized from the recorded rows.
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  const recordedByEnrollment = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendanceData?.items.forEach((a) => map.set(a.enrollmentId, a));
    return map;
  }, [attendanceData]);

  useEffect(() => {
    if (!attendanceData) return;
    setDraft(() => {
      const next: Record<string, AttendanceStatus> = {};
      attendanceData.items.forEach((a) => {
        next[a.enrollmentId] = a.status;
      });
      return next;
    });
  }, [attendanceData]);

  const roster: Enrollment[] = rosterData?.items ?? [];
  const rosterIds = useMemo(() => new Set(roster.map((e) => e.id)), [roster]);
  // Evidence for enrollments no longer ACTIVE (paused/cancelled after being
  // marked): shown read-only — the bulk endpoint only accepts the current
  // ACTIVE roster; such rows are corrected from the history page instead.
  const nonRosterRows = (attendanceData?.items ?? []).filter((a) => !rosterIds.has(a.enrollmentId));

  const isOngoing = session.status === "ONGOING";
  const isCompleted = session.status === "COMPLETED";
  const isLockedStatus = session.status === "PLANNED" || session.status === "CANCELLED";
  const pastWindow = isPastCorrectionWindow(session);
  const canRecord = hasPermission(PERMISSIONS.ATTENDANCE_CREATE);
  const canCorrect = hasPermission(PERMISSIONS.ATTENDANCE_CORRECT);
  // Post-48h edits require attendance.correct (backend-enforced; mirrored here
  // so the UI never offers a save the API would 403).
  const windowOpen = !pastWindow || canCorrect;

  const isRowEditable = (enrollmentId: string): boolean => {
    if (!canRecord || isLockedStatus) return false;
    if (isOngoing) return !recordedByEnrollment.has(enrollmentId) || windowOpen;
    if (isCompleted) return recordedByEnrollment.has(enrollmentId) && windowOpen;
    return false;
  };

  const markedCount = roster.filter((e) => draft[e.id]).length;
  const isDirty = roster.some((e) => {
    const selected = draft[e.id];
    if (!selected) return false;
    return recordedByEnrollment.get(e.id)?.status !== selected;
  });

  const handleMarkAllPresent = () => {
    setDraft((prev) => {
      const next = { ...prev };
      roster.forEach((e) => {
        if (isRowEditable(e.id)) next[e.id] = "PRESENT";
      });
      return next;
    });
  };

  const handleSave = async () => {
    const records = roster
      .filter((e) => draft[e.id] && isRowEditable(e.id))
      .map((e) => ({ enrollmentId: e.id, status: draft[e.id] }));
    if (records.length === 0) return;
    try {
      await recordMutation.mutateAsync({ records });
      emitToast("Đã lưu điểm danh", "success");
    } catch (err) {
      emitToast(extractErrorMessage(err), "error");
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({ status: "COMPLETED" });
      await qc.refetchQueries({ queryKey: classSessionKeys.lists(), type: "all" });
      // Completion is what makes deducting rows count in the derived balance.
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.details() });
      emitToast("Đã hoàn thành buổi học", "success");
    } catch (err) {
      // E1 rejection: surface the API message verbatim (e.g. "Không thể hoàn
      // thành buổi học: còn N học viên chưa được điểm danh").
      emitToast(extractErrorMessage(err), "error");
    }
  };

  if (isRosterLoading || isAttendanceLoading) return <RosterSkeleton />;

  if (isRosterError || isAttendanceError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Không thể tải dữ liệu điểm danh</p>
        <p className="mt-1 text-xs text-slate-400">Vui lòng thử lại sau</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Status notices (D4 matrix + 48h window) ─────────────────────────── */}
      {session.status === "PLANNED" && (
        <Notice tone="info">
          Buổi học chưa bắt đầu — chưa thể điểm danh. Chuyển buổi học sang trạng thái &quot;Đang
          diễn ra&quot; để bắt đầu điểm danh.
        </Notice>
      )}
      {session.status === "CANCELLED" && (
        <Notice tone="warning">Buổi học đã hủy — không thể điểm danh.</Notice>
      )}
      {isCompleted && (
        <Notice tone="info">
          Buổi học đã hoàn thành — chỉ có thể sửa các điểm danh đã ghi nhận, không thể thêm mới.
        </Notice>
      )}
      {!isLockedStatus && pastWindow && !canCorrect && (
        <Notice tone="warning">
          Đã quá 48 giờ sau khi buổi học kết thúc — chỉnh sửa điểm danh cần quyền sửa muộn. Vui lòng
          liên hệ quản trị viên.
        </Notice>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Đã điểm danh{" "}
          <span className="font-semibold text-slate-700">
            {markedCount}/{roster.length}
          </span>{" "}
          học viên
        </p>
        {isOngoing && (
          <Can permission={PERMISSIONS.ATTENDANCE_CREATE}>
            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Tất cả có mặt
            </button>
          </Can>
        )}
      </div>

      {/* ── Roster ──────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {roster.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <GraduationCap className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Lớp học chưa có học viên đang học
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Không có danh sách để điểm danh — buổi học có thể hoàn thành ngay
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {roster.map((e) => {
              const studentName = e.student ? `${e.student.firstName} ${e.student.lastName}` : "—";
              const editable = isRowEditable(e.id);
              const selected = draft[e.id];
              const lockedNew = isCompleted && !recordedByEnrollment.has(e.id);
              return (
                <div
                  key={e.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{studentName}</p>
                      <span className="font-mono text-xs text-slate-400">
                        {e.student?.code ?? "—"}
                      </span>
                    </div>
                  </div>
                  {lockedNew ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Chưa điểm danh — không thể thêm sau khi hoàn thành
                    </span>
                  ) : (
                    <div
                      role="radiogroup"
                      aria-label={`Trạng thái điểm danh của ${studentName}`}
                      className="flex shrink-0 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
                    >
                      {ATTENDANCE_STATUSES.map((status) => {
                        const cfg = ATTENDANCE_STATUS_CONFIG[status];
                        const isActive = selected === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            disabled={!editable}
                            onClick={() => setDraft((prev) => ({ ...prev, [e.id]: status }))}
                            className={cn(
                              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                              isActive
                                ? cfg.activeCls
                                : "text-slate-500 hover:bg-white hover:text-slate-700",
                              !editable && "cursor-not-allowed opacity-60"
                            )}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Evidence of former members (read-only) ──────────────────────────── */}
      {nonRosterRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Học viên không còn trong danh sách lớp
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {nonRosterRows.map((a) => {
              const cfg = ATTENDANCE_STATUS_CONFIG[a.status];
              const name = a.enrollment?.student
                ? `${a.enrollment.student.firstName} ${a.enrollment.student.lastName}`
                : "—";
              return (
                <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-600">{name}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                      cfg.cls
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      {!isLockedStatus && (
        <div className="flex flex-wrap items-center justify-end gap-3 pb-2">
          <Can permission={PERMISSIONS.ATTENDANCE_CREATE}>
            <button
              onClick={handleSave}
              disabled={!isDirty || recordMutation.isPending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {recordMutation.isPending ? "Đang lưu..." : "Lưu điểm danh"}
            </button>
          </Can>
          {isOngoing && (
            <Can permission={PERMISSIONS.CLASS_SESSION_UPDATE}>
              <button
                onClick={handleComplete}
                disabled={completeMutation.isPending || isDirty}
                title={isDirty ? "Lưu điểm danh trước khi hoàn thành buổi học" : undefined}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ClipboardCheck className="h-4 w-4" />
                {completeMutation.isPending ? "Đang hoàn thành..." : "Hoàn thành buổi học"}
              </button>
            </Can>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionAttendance() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading, isError, refetch } = useClassSession(id);

  const backHref = session ? `/classes/${session.classId}` : "/classes";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          <span className="text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/classes")}
            className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Điểm danh buổi học</h2>
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

  const statusCfg = CLASS_SESSION_STATUS_CONFIG[session.status];

  return (
    <div className="mx-auto max-w-3xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(backHref)}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Điểm danh — Buổi {session.sessionNumber}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            {session.class?.name && <span>{session.class.name}</span>}
            <span>·</span>
            <span>
              {formatDate(session.date)} · {formatTime(session.startTime)}–
              {formatTime(session.endTime)}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
            statusCfg.cls
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
          {statusCfg.label}
        </span>
      </div>

      <AttendanceRoster session={session} />
    </div>
  );
}
