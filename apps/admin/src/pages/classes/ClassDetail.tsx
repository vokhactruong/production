import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  Pencil,
  Layers,
  Activity,
  Clock,
  FileEdit,
  FilePlus,
  Trash2,
  Hash,
  AlignLeft,
  Users,
  BookMarked,
  BookOpen,
  DoorOpen,
  UserRound,
  CalendarDays,
  CalendarClock,
  ClipboardCheck,
  Repeat,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useClass } from "../../features/classes/hooks/use-class";
import { useClassActivity } from "../../features/classes/hooks/use-class-activity";
import { useClassSchedules } from "../../features/class-schedules/hooks/use-class-schedules";
import { classSchedulesApi } from "../../features/class-schedules/api/class-schedules.api";
import { classScheduleKeys } from "../../features/class-schedules/hooks/query-keys";
import { useClassSessions } from "../../features/class-sessions/hooks/use-class-sessions";
import { classSessionKeys } from "../../features/class-sessions/hooks/query-keys";
import { useGenerateSessions } from "../../features/class-sessions/hooks/use-generate-sessions";
import { useSyncSessions } from "../../features/class-sessions/hooks/use-sync-sessions";
import Can from "../../components/Can";
import { useToast } from "../../components/Toast";
import { PERMISSIONS } from "../../constants/permissions";
import { cn, formatDateTime, formatDate, formatTime } from "../../utils";
import { CLASS_STATUS_CONFIG } from "./constants";
import { CLASS_SESSION_STATUS_CONFIG } from "../class-sessions/constants";
import type { Class, ClassSession } from "../../types";

const ACTION_CONFIG: Record<
  string,
  { label: string; badgeCls: string; iconCls: string; Icon: React.ElementType }
> = {
  CREATE: {
    label: "Tạo mới",
    badgeCls: "bg-green-100 text-green-700",
    iconCls: "bg-green-100 text-green-600",
    Icon: FilePlus,
  },
  UPDATE: {
    label: "Cập nhật",
    badgeCls: "bg-blue-100 text-blue-700",
    iconCls: "bg-blue-100 text-blue-600",
    Icon: FileEdit,
  },
  DELETE: {
    label: "Xoá",
    badgeCls: "bg-red-100 text-red-700",
    iconCls: "bg-red-100 text-red-600",
    Icon: Trash2,
  },
  GENERATE_SESSIONS: {
    label: "Tạo buổi học",
    badgeCls: "bg-green-100 text-green-700",
    iconCls: "bg-green-100 text-green-600",
    Icon: CalendarClock,
  },
  SYNC_SESSIONS: {
    label: "Đồng bộ buổi học",
    badgeCls: "bg-indigo-100 text-indigo-700",
    iconCls: "bg-indigo-100 text-indigo-600",
    Icon: RefreshCw,
  },
};

const WEEKDAY_LABELS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

type Tab = "overview" | "schedule" | "sessions" | "activity";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Tổng quan", icon: Layers },
  { id: "schedule", label: "Lịch học", icon: CalendarDays },
  { id: "sessions", label: "Buổi học", icon: CalendarClock },
  { id: "activity", label: "Hoạt động", icon: Activity },
];

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 first:pt-4 last:pb-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <div
          className={cn(
            "mt-0.5 break-words text-sm leading-snug",
            !value && "text-slate-400 italic"
          )}
        >
          {value || "Chưa cập nhật"}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50 px-5">{children}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-200" />
        <div className="h-7 w-48 rounded-lg bg-slate-200" />
      </div>
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-200" />
          <div className="flex-1">
            <div className="h-6 w-48 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-5 w-24 rounded-lg bg-slate-200" />
          </div>
          <div className="h-9 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>
      <div className="mb-5 h-11 rounded-xl bg-slate-100" />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-50 px-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3 w-14 rounded bg-slate-200" />
                <div className="h-4 w-40 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ classItem }: { classItem: Class }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Thông tin lớp học" icon={Layers}>
        <InfoRow icon={Hash} label="Mã lớp học" value={classItem.code} />
        <InfoRow icon={BookMarked} label="Khóa học" value={classItem.course?.name} />
        <InfoRow icon={BookOpen} label="Môn học" value={classItem.subject?.name} />
        <InfoRow
          icon={UserRound}
          label="Giáo viên"
          value={
            classItem.employee
              ? `${classItem.employee.firstName} ${classItem.employee.lastName}`
              : undefined
          }
        />
        <InfoRow icon={DoorOpen} label="Phòng học" value={classItem.classroom?.name} />
        <InfoRow icon={AlignLeft} label="Mô tả" value={classItem.description} />
      </SectionCard>

      <SectionCard title="Sức chứa & Thời gian học" icon={Users}>
        <InfoRow
          icon={Users}
          label="Sức chứa"
          value={
            <span className="font-semibold text-slate-900">{classItem.capacity} học viên</span>
          }
        />
        <InfoRow
          icon={Repeat}
          label="Số buổi học / chu kỳ"
          value={
            <span className="font-semibold text-slate-900">{classItem.sessionCount} buổi</span>
          }
        />
        <InfoRow icon={CalendarDays} label="Ngày bắt đầu" value={formatDate(classItem.startDate)} />
        <InfoRow icon={CalendarDays} label="Ngày kết thúc" value={formatDate(classItem.endDate)} />
      </SectionCard>

      <SectionCard title="Trạng thái & Thời gian" icon={Clock}>
        <div className="py-3.5 first:pt-4">
          <p className="text-xs font-medium text-slate-400">Trạng thái hiện tại</p>
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold",
                CLASS_STATUS_CONFIG[classItem.status].cls
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  CLASS_STATUS_CONFIG[classItem.status].dot
                )}
              />
              {CLASS_STATUS_CONFIG[classItem.status].label}
            </span>
          </div>
        </div>
        <InfoRow icon={Clock} label="Ngày tạo" value={formatDateTime(classItem.createdAt)} />
        <InfoRow
          icon={Clock}
          label="Cập nhật lần cuối"
          value={formatDateTime(classItem.updatedAt)}
        />
      </SectionCard>
    </div>
  );
}

// ─── Schedule Tab (Planning Layer) ─────────────────────────────────────────────

interface ScheduleRow {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

function ScheduleTab({ classItem }: { classItem: Class }) {
  const { data: schedules, isLoading } = useClassSchedules(classItem.id);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const qc = useQueryClient();
  const { emitToast } = useToast();

  const isLocked = classItem.status === "COMPLETED" || classItem.status === "CANCELLED";
  const canEdit = !isLocked;

  useEffect(() => {
    if (schedules) {
      setRows(
        schedules.map((s) => ({
          id: s.id,
          weekday: s.weekday,
          startTime: formatTime(s.startTime),
          endTime: formatTime(s.endTime),
        }))
      );
    }
  }, [schedules]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const addRow = () => setRows((r) => [...r, { weekday: 1, startTime: "", endTime: "" }]);
  const removeRow = (index: number) => setRows((r) => r.filter((_, i) => i !== index));
  const updateRow = (index: number, patch: Partial<ScheduleRow>) =>
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    for (const row of rows) {
      if (!row.startTime || !row.endTime) {
        emitToast("Vui lòng điền đầy đủ giờ bắt đầu và giờ kết thúc", "error");
        return;
      }
      if (row.startTime >= row.endTime) {
        emitToast("Giờ kết thúc phải sau giờ bắt đầu", "error");
        return;
      }
    }

    setIsSaving(true);
    try {
      const existing = schedules ?? [];
      const keptIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));
      const toDelete = existing.filter((s) => !keptIds.has(s.id));
      const toCreate = rows.filter((r) => !r.id);
      const toUpdate = rows.filter((r) => r.id);

      await Promise.all([
        ...toDelete.map((s) => classSchedulesApi.delete(s.id)),
        ...toCreate.map((r) =>
          classSchedulesApi.create({
            classId: classItem.id,
            weekday: r.weekday,
            startTime: r.startTime,
            endTime: r.endTime,
          })
        ),
        ...toUpdate.map((r) =>
          classSchedulesApi.update(r.id!, {
            weekday: r.weekday,
            startTime: r.startTime,
            endTime: r.endTime,
          })
        ),
      ]);

      await qc.invalidateQueries({ queryKey: classScheduleKeys.list({ classId: classItem.id }) });
      emitToast("Đã lưu lịch học", "success");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Lịch học hàng tuần" icon={CalendarDays}>
        <div className="flex flex-col gap-3 py-4">
          {isLocked && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Lớp học đã {classItem.status === "COMPLETED" ? "hoàn thành" : "hủy"}, lịch học đã bị
              khóa.
            </p>
          )}
          {rows.length === 0 && (
            <p className="text-sm italic text-slate-400">Chưa có khung giờ học nào.</p>
          )}
          {rows.map((row, i) => (
            <div key={row.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2">
              <select
                value={row.weekday}
                onChange={(e) => updateRow(i, { weekday: Number(e.target.value) })}
                disabled={!canEdit}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {WEEKDAY_LABELS.map((label, value) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={row.startTime}
                onChange={(e) => updateRow(i, { startTime: e.target.value })}
                disabled={!canEdit}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              <span className="text-sm text-slate-400">đến</span>
              <input
                type="time"
                value={row.endTime}
                onChange={(e) => updateRow(i, { endTime: e.target.value })}
                disabled={!canEdit}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {canEdit && (
                <button
                  onClick={() => removeRow(i)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                  aria-label="Xoá khung giờ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <Can permission={PERMISSIONS.CLASS_SCHEDULE_CREATE}>
              <button
                onClick={addRow}
                className="flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Thêm khung giờ
              </button>
            </Can>
          )}
        </div>
      </SectionCard>

      {canEdit && (
        <Can permission={PERMISSIONS.CLASS_SCHEDULE_UPDATE}>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Đang lưu..." : "Lưu lịch học"}
            </button>
          </div>
        </Can>
      )}
    </div>
  );
}

// ─── Sessions Tab (Execution Layer) ────────────────────────────────────────────

const SESSIONS_PAGE_SIZE = 10;

function SessionsTab({ classItem }: { classItem: Class }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const [page, setPage] = useState(1);

  const { data: sessionsData, isLoading } = useClassSessions({
    classId: classItem.id,
    page,
    limit: SESSIONS_PAGE_SIZE,
  });
  const generateMutation = useGenerateSessions(classItem.id);
  const syncMutation = useSyncSessions(classItem.id);

  const total = sessionsData?.meta.total ?? 0;
  const showGenerate = !isLoading && total === 0;
  const showSync = !isLoading && total > 0;
  const isOpen = classItem.status === "OPEN";

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync();
      await qc.invalidateQueries({ queryKey: classSessionKeys.lists() });
      emitToast(`Đã tạo ${result.generatedCount} buổi học`, "success");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      await qc.invalidateQueries({ queryKey: classSessionKeys.lists() });
      emitToast(
        result.generatedCount > 0
          ? `Đã đồng bộ thêm ${result.generatedCount} buổi học`
          : "Không có buổi học nào cần đồng bộ",
        "success"
      );
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{isLoading ? "Đang tải..." : `${total} buổi học`}</p>
        <div className="flex gap-2">
          {showGenerate && (
            <Can permission={PERMISSIONS.CLASS_SESSION_GENERATE}>
              <button
                onClick={handleGenerate}
                disabled={!isOpen || generateMutation.isPending}
                title={!isOpen ? "Chỉ có thể tạo buổi học khi lớp học đang Đang mở" : undefined}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CalendarClock className="h-4 w-4" />
                {generateMutation.isPending ? "Đang tạo..." : "Tạo buổi học ban đầu"}
              </button>
            </Can>
          )}
          {showSync && (
            <Can permission={PERMISSIONS.CLASS_SESSION_SYNC}>
              <button
                onClick={handleSync}
                disabled={!isOpen || syncMutation.isPending}
                title={!isOpen ? "Chỉ có thể đồng bộ khi lớp học đang Đang mở" : undefined}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                {syncMutation.isPending ? "Đang đồng bộ..." : "Đồng bộ buổi học"}
              </button>
            </Can>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Buổi học
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                  Ngày & Giờ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5" colSpan={4}>
                      <div className="h-4 w-full rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : sessionsData?.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <CalendarClock className="h-7 w-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Chưa có buổi học nào</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Thiết lập lịch học rồi nhấn &quot;Tạo buổi học ban đầu&quot; để bắt đầu
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sessionsData?.items.map((s: ClassSession) => {
                  const statusCfg = CLASS_SESSION_STATUS_CONFIG[s.status];
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">Buổi {s.sessionNumber}</p>
                        <span className="text-xs text-slate-400">{s.topic || "—"}</span>
                      </td>
                      <td className="hidden px-4 py-3.5 sm:table-cell">
                        <span className="text-sm text-slate-700">{formatDate(s.date)}</span>
                        <span className="ml-1.5 text-xs text-slate-400">
                          {formatTime(s.startTime)}–{formatTime(s.endTime)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                            statusCfg.cls
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <Can permission={PERMISSIONS.ATTENDANCE_READ}>
                            <button
                              onClick={() => navigate(`/class-sessions/${s.id}/attendance`)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                              aria-label={`Điểm danh buổi ${s.sessionNumber}`}
                            >
                              <ClipboardCheck className="h-4 w-4" />
                            </button>
                          </Can>
                          <Can permission={PERMISSIONS.CLASS_SESSION_UPDATE}>
                            <button
                              onClick={() => navigate(`/class-sessions/${s.id}/edit`)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                              aria-label={`Chỉnh sửa buổi ${s.sessionNumber}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sessionsData && sessionsData.meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-xs text-slate-400">
            Trang {page} / {sessionsData.meta.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(sessionsData.meta.totalPages, p + 1))}
              disabled={page === sessionsData.meta.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Activity Tab ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function ActivityTab({ classId }: { classId: string }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data: logs, isLoading, isFetching } = useClassActivity(classId, limit);
  const hasMore = logs ? logs.meta.total > limit : false;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="px-5 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-start gap-4 py-4">
              <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 rounded-md bg-slate-200" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
                <div className="mt-2 h-3 w-28 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!logs || logs.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Activity className="h-7 w-7 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Chưa có hoạt động nào</p>
        <p className="mt-1 text-xs text-slate-400">Lịch sử thay đổi sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800">Lịch sử hoạt động</h3>
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {logs.meta.total} sự kiện
        </span>
      </div>
      <div className="relative px-5 py-3">
        <div className="absolute bottom-3 left-[2.125rem] top-3 w-px bg-slate-100" />
        <div className="flex flex-col gap-1">
          {logs.items.map((log) => {
            const cfg = ACTION_CONFIG[log.action] ?? {
              label: log.action,
              badgeCls: "bg-slate-100 text-slate-600",
              iconCls: "bg-slate-100 text-slate-500",
              Icon: Activity,
            };
            const { Icon } = cfg;
            const actorName = log.user ? `${log.user.firstName} ${log.user.lastName}` : "Hệ thống";
            return (
              <div key={log.id} className="flex items-start gap-4 py-3">
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white",
                    cfg.iconCls
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", cfg.badgeCls)}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-500">lớp học</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-600">{actorName}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {hasMore && (
        <div className="border-t border-slate-100 px-5 py-3 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            disabled={isFetching}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 transition-colors"
          >
            {isFetching ? "Đang tải..." : `Tải thêm · còn ${logs.meta.total - limit} sự kiện`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: classItem, isLoading, isError } = useClass(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !classItem) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-24 text-slate-400">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Layers className="h-8 w-8 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Không tìm thấy lớp học</p>
        <p className="mt-1 text-xs text-slate-400">Lớp học này không tồn tại hoặc đã bị xoá</p>
        <button
          onClick={() => navigate("/classes")}
          className="mt-5 flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const status = CLASS_STATUS_CONFIG[classItem.status];

  return (
    <div className="mx-auto max-w-3xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/classes")}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Chi tiết lớp học</h2>
      </div>

      {/* ── Profile card ────────────────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Layers className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{classItem.name}</h1>
              <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-500">
                {classItem.code}
              </span>
            </div>
            {classItem.course && (
              <p className="mt-1 text-sm text-slate-500">
                Khóa học:{" "}
                <span className="font-medium text-slate-700">{classItem.course.name}</span>
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
                  status.cls
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {classItem.capacity} học viên
              </span>
            </div>
          </div>
          <Can permission={PERMISSIONS.CLASS_UPDATE}>
            <button
              onClick={() => navigate(`/classes/${classItem.id}/edit`)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chỉnh sửa</span>
            </button>
          </Can>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Thông tin lớp học"
        className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm"
      >
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            role="tab"
            aria-selected={tab === tabId}
            aria-controls={`tabpanel-${tabId}`}
            id={`tab-${tabId}`}
            onClick={() => setTab(tabId)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
              tab === tabId
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "overview" && <OverviewTab classItem={classItem} />}
        {tab === "schedule" && <ScheduleTab classItem={classItem} />}
        {tab === "sessions" && <SessionsTab classItem={classItem} />}
        {tab === "activity" && <ActivityTab classId={classItem.id} />}
      </div>
    </div>
  );
}
