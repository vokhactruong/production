import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Activity,
  Briefcase,
  Clock,
  FileEdit,
  FilePlus,
  Trash2,
} from "lucide-react";
import { useEmployee } from "../../features/employees/hooks/use-employee";
import { useEmployeeActivity } from "../../features/employees/hooks/use-employee-activity";
import Can from "../../components/Can";
import { PERMISSIONS } from "../../constants/permissions";
import { cn, formatDate, formatDateTime, getInitials } from "../../utils";
import { EMPLOYEE_STATUS_CONFIG, EMPLOYEE_TYPE_CONFIG, GENDER_LABEL } from "./constants";
import type { Employee } from "../../types";

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

type Tab = "overview" | "activity";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Tổng quan", icon: User },
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="mb-6 h-8 w-48 rounded-xl bg-slate-200" />
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-40 rounded-md bg-slate-200" />
            <div className="h-4 w-24 rounded-md bg-slate-200" />
            <div className="h-5 w-20 rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 h-4 w-32 rounded-md bg-slate-200" />
            <div className="flex flex-col gap-3">
              <div className="h-3.5 w-full rounded-md bg-slate-200" />
              <div className="h-3.5 w-3/4 rounded-md bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ employee }: { employee: Employee }) {
  const typeCfg = EMPLOYEE_TYPE_CONFIG[employee.employeeType];

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Thông tin cá nhân" icon={User}>
        <InfoRow
          icon={User}
          label="Giới tính"
          value={employee.gender ? GENDER_LABEL[employee.gender] : null}
        />
        <InfoRow
          icon={Calendar}
          label="Ngày sinh"
          value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null}
        />
        <InfoRow icon={Phone} label="Số điện thoại" value={employee.phone} />
        <InfoRow icon={Mail} label="Email" value={employee.email} />
        <InfoRow icon={MapPin} label="Địa chỉ" value={employee.address} />
      </SectionCard>

      <SectionCard title="Thông tin công việc" icon={Briefcase}>
        <InfoRow icon={Briefcase} label="Chức vụ" value={typeCfg.label} />
        <InfoRow
          icon={Calendar}
          label="Ngày vào làm"
          value={employee.hireDate ? formatDate(employee.hireDate) : null}
        />
        <InfoRow icon={Clock} label="Ngày tạo hồ sơ" value={formatDate(employee.createdAt)} />
      </SectionCard>

      {employee.notes && (
        <SectionCard title="Ghi chú" icon={FileEdit}>
          <div className="py-4 text-sm text-slate-700 whitespace-pre-line">{employee.notes}</div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ employeeId, active }: { employeeId: string; active: boolean }) {
  const { data, isLoading } = useEmployeeActivity(employeeId, 20, { enabled: active });
  const logs = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="h-8 w-8 shrink-0 rounded-xl bg-slate-200" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3.5 w-3/4 rounded-md bg-slate-200" />
              <div className="h-3 w-1/3 rounded-md bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Activity className="h-6 w-6 text-slate-400" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có hoạt động</p>
        <p className="mt-1 text-xs text-slate-400">Lịch sử thay đổi sẽ xuất hiện ở đây</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {logs.map((log) => {
        const cfg = ACTION_CONFIG[log.action] ?? {
          label: log.action,
          badgeCls: "bg-slate-100 text-slate-600",
          iconCls: "bg-slate-100 text-slate-500",
          Icon: Activity,
        };
        return (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                cfg.iconCls
              )}
            >
              <cfg.Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-lg px-2 py-0.5 text-xs font-medium", cfg.badgeCls)}>
                  {cfg.label}
                </span>
                {log.user && (
                  <span className="text-xs text-slate-500">
                    bởi{" "}
                    <span className="font-medium text-slate-700">
                      {log.user.lastName} {log.user.firstName}
                    </span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(log.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: employee, isLoading, isError, refetch } = useEmployee(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !employee) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/employees")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Chi tiết nhân viên</h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
          <p className="text-sm font-semibold text-slate-700">Không thể tải nhân viên</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate("/employees")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Quay lại danh sách
            </button>
            <button
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

  const statusCfg = EMPLOYEE_STATUS_CONFIG[employee.status];
  const typeCfg = EMPLOYEE_TYPE_CONFIG[employee.employeeType];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back + Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/employees")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Chi tiết nhân viên</h1>
        </div>
        <Can permission={PERMISSIONS.EMPLOYEE_UPDATE}>
          <button
            onClick={() => navigate(`/employees/${employee.id}/edit`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa
          </button>
        </Can>
      </div>

      {/* Profile Card */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {employee.avatar ? (
            <img
              src={employee.avatar}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white shadow"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-lg font-bold text-white ring-4 ring-white shadow">
              {getInitials(employee.firstName, employee.lastName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">
              {employee.lastName} {employee.firstName}
            </h2>
            <p className="font-mono text-sm text-slate-400">{employee.code}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                  statusCfg.cls
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium",
                  typeCfg.cls
                )}
              >
                {typeCfg.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Thông tin nhân viên"
        className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
      >
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            role="tab"
            id={`tab-${tabId}`}
            aria-selected={tab === tabId}
            aria-controls={`tabpanel-${tabId}`}
            onClick={() => setTab(tabId)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === tabId
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tab === "overview" && (
        <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
          <OverviewTab employee={employee} />
        </div>
      )}
      <div
        role="tabpanel"
        id="tabpanel-activity"
        aria-labelledby="tab-activity"
        hidden={tab !== "activity"}
      >
        <ActivityTab employeeId={employee.id} active={tab === "activity"} />
      </div>
    </div>
  );
}
