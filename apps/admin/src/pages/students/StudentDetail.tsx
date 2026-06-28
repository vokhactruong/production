import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Users,
  Activity,
  Clock,
  FileEdit,
  FilePlus,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { studentsApi, auditLogsApi, getData, getList } from "../../api/client";
import Can from "../../components/Can";
import { PERMISSIONS } from "../../constants/permissions";
import { cn, formatDate, formatDateTime, getInitials } from "../../utils";
import { STATUS_CONFIG, GENDER_LABEL, studentKeys, auditLogKeys } from "./constants";
import type { Student, AuditLog } from "../../types";

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
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "guardian" | "activity";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Tổng quan", icon: User },
  { id: "guardian", label: "Phụ huynh", icon: Users },
  { id: "activity", label: "Hoạt động", icon: Activity },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 first:pt-4 last:pb-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p
          className={cn(
            "mt-0.5 break-words text-sm leading-snug",
            value ? "text-slate-900" : "text-slate-400 italic"
          )}
        >
          {value || "Chưa cập nhật"}
        </p>
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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-200" />
        <div className="h-7 w-44 rounded-lg bg-slate-200" />
      </div>

      {/* Profile card */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-36 rounded-lg bg-slate-200" />
              <div className="h-5 w-16 rounded-lg bg-slate-200" />
            </div>
            <div className="mt-3 flex gap-4">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-36 rounded bg-slate-200" />
            </div>
            <div className="mt-3 h-5 w-24 rounded-lg bg-slate-200" />
          </div>
          <div className="h-9 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 h-11 rounded-xl bg-slate-100" />

      {/* Card */}
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

// ─── Tab content ──────────────────────────────────────────────────────────────

function OverviewTab({ student }: { student: Student }) {
  const status = STATUS_CONFIG[student.status];

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Thông tin cá nhân" icon={User}>
        <InfoRow
          icon={Calendar}
          label="Ngày sinh"
          value={student.dateOfBirth ? formatDate(student.dateOfBirth) : null}
        />
        <InfoRow
          icon={User}
          label="Giới tính"
          value={student.gender ? GENDER_LABEL[student.gender] : null}
        />
        <InfoRow icon={Phone} label="Số điện thoại" value={student.phone} />
        <InfoRow icon={Mail} label="Email" value={student.email} />
        <InfoRow icon={MapPin} label="Địa chỉ" value={student.address} />
      </SectionCard>

      <SectionCard title="Trạng thái & Thời gian" icon={Clock}>
        <div className="py-3.5 first:pt-4">
          <p className="text-xs font-medium text-slate-400">Trạng thái hiện tại</p>
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold",
                status.cls
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
          </div>
        </div>
        <InfoRow icon={Clock} label="Ngày tạo" value={formatDateTime(student.createdAt)} />
        <InfoRow icon={Clock} label="Cập nhật lần cuối" value={formatDateTime(student.updatedAt)} />
      </SectionCard>

      {student.notes && (
        <SectionCard title="Ghi chú">
          <div className="py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {student.notes}
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function GuardianTab({ student }: { student: Student }) {
  const navigate = useNavigate();
  const hasGuardian = student.guardianName || student.guardianPhone || student.guardianEmail;

  if (!hasGuardian) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Users className="h-7 w-7 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Chưa có thông tin phụ huynh</p>
        <p className="mt-1 text-xs text-slate-400">Cập nhật thông tin trong trang chỉnh sửa</p>
        <Can permission={PERMISSIONS.STUDENT_UPDATE}>
          <button
            onClick={() => navigate(`/students/${student.id}/edit`)}
            className="mt-4 flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa hồ sơ
          </button>
        </Can>
      </div>
    );
  }

  return (
    <SectionCard title="Thông tin phụ huynh / Người giám hộ" icon={Users}>
      <InfoRow icon={User} label="Họ tên" value={student.guardianName} />
      <InfoRow icon={Phone} label="Số điện thoại" value={student.guardianPhone} />
      <InfoRow icon={Mail} label="Email" value={student.guardianEmail} />
    </SectionCard>
  );
}

const PAGE_SIZE = 10;

function ActivityTab({ studentId }: { studentId: string }) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: auditLogKeys.forEntity("Student", studentId, limit),
    queryFn: () => auditLogsApi.getForEntity("Student", studentId, { limit }),
    placeholderData: keepPreviousData,
  });

  const logs = data ? getList<AuditLog>(data) : null;
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
        {/* Vertical line */}
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
                {/* Icon bubble */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white",
                    cfg.iconCls
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", cfg.badgeCls)}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-500">hồ sơ học sinh</span>
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

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const { data, isLoading, isError } = useQuery({
    queryKey: studentKeys.detail(id!),
    queryFn: () => studentsApi.getOne(id!),
    enabled: Boolean(id),
  });

  const student = useMemo(() => (data ? getData<Student>(data) : null), [data]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !student) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-24 text-slate-400">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <GraduationCap className="h-8 w-8 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Không tìm thấy học sinh</p>
        <p className="mt-1 text-xs text-slate-400">Học sinh này không tồn tại hoặc đã bị xoá</p>
        <button
          onClick={() => navigate("/students")}
          className="mt-5 flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const status = STATUS_CONFIG[student.status];

  return (
    <div className="mx-auto max-w-3xl">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/students")}
          className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hồ sơ học sinh</h2>
        </div>
      </div>

      {/* ── Profile card ──────────────────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-lg font-bold text-white shadow-sm sm:h-16 sm:w-16 sm:text-xl">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={`${student.firstName} ${student.lastName}`}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              getInitials(student.firstName, student.lastName)
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                {student.firstName} {student.lastName}
              </h1>
              {student.code && (
                <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-500">
                  {student.code}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {student.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {student.phone}
                </span>
              )}
              {student.email && (
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{student.email}</span>
                </span>
              )}
            </div>

            <div className="mt-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
                  status.cls
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
          </div>

          {/* Edit button */}
          <Can permission={PERMISSIONS.STUDENT_UPDATE}>
            <button
              onClick={() => navigate(`/students/${student.id}/edit`)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chỉnh sửa</span>
            </button>
          </Can>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Thông tin học sinh"
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
            <span className="sm:hidden text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "overview" && <OverviewTab student={student} />}
        {tab === "guardian" && <GuardianTab student={student} />}
        {tab === "activity" && <ActivityTab studentId={student.id} />}
      </div>
    </div>
  );
}
