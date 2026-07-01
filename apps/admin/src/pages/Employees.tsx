import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Eye,
  AlertCircle,
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { useEmployees } from "../features/employees/hooks/use-employees";
import { useDeleteEmployee } from "../features/employees/hooks/use-delete-employee";
import { useToast } from "../components/Toast";
import Can from "../components/Can";
import { PERMISSIONS } from "../constants/permissions";
import { cn, getInitials } from "../utils";
import { useDebounce } from "../hooks";
import { EMPLOYEE_STATUS_CONFIG, EMPLOYEE_TYPE_CONFIG } from "./employees/constants";
import type { Employee } from "../types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-28 rounded-md bg-slate-200" />
            <div className="h-3 w-20 rounded-md bg-slate-200" />
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 sm:table-cell">
        <div className="h-5 w-20 rounded-lg bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3.5 md:table-cell">
        <div className="h-3.5 w-24 rounded-md bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3.5 lg:table-cell">
        <div className="h-3.5 w-32 rounded-md bg-slate-200" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-5 w-24 rounded-lg bg-slate-200" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end gap-1.5">
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
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
        {from}–{to} / {total} nhân viên
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Trang trước"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Trang ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Trang sau"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Employee Row ─────────────────────────────────────────────────────────────

interface EmployeeRowProps {
  employee: Employee;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (e: Pick<Employee, "id" | "firstName" | "lastName" | "code">) => void;
}

const EmployeeRow = memo(function EmployeeRow({
  employee: e,
  onView,
  onEdit,
  onDelete,
}: EmployeeRowProps) {
  const statusCfg = EMPLOYEE_STATUS_CONFIG[e.status];
  const typeCfg = EMPLOYEE_TYPE_CONFIG[e.employeeType];

  return (
    <tr className="group hover:bg-blue-50/40 transition-colors">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          {e.avatar ? (
            <img
              src={e.avatar}
              alt={`${e.firstName} ${e.lastName}`}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-bold text-white ring-2 ring-white">
              {getInitials(e.firstName, e.lastName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {e.lastName} {e.firstName}
            </p>
            <p className="font-mono text-xs text-slate-400">{e.code}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 sm:table-cell">
        <span
          className={cn(
            "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium",
            typeCfg.cls
          )}
        >
          {typeCfg.label}
        </span>
      </td>
      <td className="hidden px-4 py-3.5 text-sm text-slate-600 md:table-cell">
        {e.phone || <span className="text-slate-400 italic">—</span>}
      </td>
      <td className="hidden px-4 py-3.5 text-sm text-slate-600 lg:table-cell">
        {e.email || <span className="text-slate-400 italic">—</span>}
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
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Can permission={PERMISSIONS.EMPLOYEE_READ}>
            <button
              onClick={() => onView(e.id)}
              title="Xem chi tiết"
              aria-label={`Xem chi tiết ${e.firstName} ${e.lastName}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </Can>
          <Can permission={PERMISSIONS.EMPLOYEE_UPDATE}>
            <button
              onClick={() => onEdit(e.id)}
              title="Chỉnh sửa"
              aria-label={`Chỉnh sửa ${e.firstName} ${e.lastName}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Can>
          <Can permission={PERMISSIONS.EMPLOYEE_DELETE}>
            <button
              onClick={() => onDelete(e)}
              title="Xóa"
              aria-label={`Xóa ${e.firstName} ${e.lastName}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Can>
        </div>
      </td>
    </tr>
  );
});

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  employee,
  onConfirm,
  onCancel,
  isPending,
}: {
  employee: Pick<Employee, "id" | "firstName" | "lastName" | "code">;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div ref={dialogRef} className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h2 id="delete-dialog-title" className="text-base font-semibold text-slate-900">
          Xóa nhân viên?
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Nhân viên{" "}
          <span className="font-semibold text-slate-700">
            {employee.lastName} {employee.firstName}
          </span>{" "}
          ({employee.code}) sẽ bị xóa. Hành động này không thể hoàn tác.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Đang xóa..." : "Xóa nhân viên"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Employees() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { emitToast } = useToast();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [employeeType, setEmployeeType] = useState(searchParams.get("employeeType") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [deleteEmployee, setDeleteEmployee] = useState<Pick<
    Employee,
    "id" | "firstName" | "lastName" | "code"
  > | null>(null);

  const search = useDebounce(searchInput, 400);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (employeeType) params.employeeType = employeeType;
    if (status) params.status = status;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [search, employeeType, status, page]);

  const { data, isLoading, isError, refetch } = useEmployees({
    search: search || undefined,
    employeeType: employeeType || undefined,
    status: status || undefined,
    page,
  });

  const deleteMutation = useDeleteEmployee();

  const handleView = useCallback((id: string) => navigate(`/employees/${id}`), [navigate]);
  const handleEdit = useCallback((id: string) => navigate(`/employees/${id}/edit`), [navigate]);
  const handleDeleteClick = useCallback(
    (e: Pick<Employee, "id" | "firstName" | "lastName" | "code">) => setDeleteEmployee(e),
    []
  );

  const handleDeleteConfirm = () => {
    if (!deleteEmployee) return;
    deleteMutation.mutate(deleteEmployee.id, {
      onSuccess: () => {
        emitToast("Đã xóa nhân viên", "success");
        setDeleteEmployee(null);
      },
      onError: (err) => {
        const msg = axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
          : "Có lỗi xảy ra";
        emitToast(msg, "error");
      },
    });
  };

  const hasFilters = Boolean(search || employeeType || status);
  const employees = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhân viên</h1>
          <p className="mt-0.5 text-sm text-slate-500">Quản lý thông tin nhân sự trung tâm</p>
        </div>
        <Can permission={PERMISSIONS.EMPLOYEE_CREATE}>
          <button
            onClick={() => navigate("/employees/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm nhân viên
          </button>
        </Can>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm tên, mã, email, số điện thoại..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tìm kiếm nhân viên"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setPage(1);
              }}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={employeeType}
          onChange={(e) => {
            setEmployeeType(e.target.value);
            setPage(1);
          }}
          aria-label="Lọc theo loại nhân viên"
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại</option>
          <option value="TEACHER">Giáo viên</option>
          <option value="RECEPTIONIST">Lễ tân</option>
          <option value="ACCOUNTANT">Kế toán</option>
          <option value="ACADEMIC">Học vụ</option>
          <option value="MANAGER">Quản lý</option>
          <option value="DIRECTOR">Giám đốc</option>
          <option value="OTHER">Khác</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang làm việc</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="ON_LEAVE">Nghỉ phép</option>
          <option value="RESIGNED">Đã nghỉ việc</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]" aria-label="Danh sách nhân viên">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nhân viên
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                  Chức vụ
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  Điện thoại
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Không thể tải danh sách
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <Briefcase className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {hasFilters ? "Không tìm thấy kết quả" : "Chưa có nhân viên nào"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {hasFilters
                          ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm"
                          : "Bắt đầu bằng cách thêm nhân viên đầu tiên"}
                      </p>
                      {!hasFilters && (
                        <Can permission={PERMISSIONS.EMPLOYEE_CREATE}>
                          <button
                            onClick={() => navigate("/employees/new")}
                            className="mt-1 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Thêm nhân viên
                          </button>
                        </Can>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((e) => (
                  <EmployeeRow
                    key={e.id}
                    employee={e}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {deleteEmployee && (
        <DeleteDialog
          employee={deleteEmployee}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteEmployee(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
