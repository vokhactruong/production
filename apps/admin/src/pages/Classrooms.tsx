import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Eye,
  AlertCircle,
  DoorOpen,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { useClassrooms } from "../features/classrooms/hooks/use-classrooms";
import { useDeleteClassroom } from "../features/classrooms/hooks/use-delete-classroom";
import { useToast } from "../components/Toast";
import { DeleteDialog } from "../components/DeleteDialog";
import Can from "../components/Can";
import { PERMISSIONS } from "../constants/permissions";
import { cn } from "../utils";
import { useDebounce } from "../hooks";
import { CLASSROOM_TYPE_CONFIG, CLASSROOM_ACTIVE_CONFIG } from "./classrooms/constants";
import type { Classroom } from "../types";

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
        <div className="h-3.5 w-20 rounded-md bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3.5 md:table-cell">
        <div className="h-3.5 w-12 rounded-md bg-slate-200" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-5 w-20 rounded-lg bg-slate-200" />
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
        {from}–{to} / {total} phòng học
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

// ─── Classroom Row ─────────────────────────────────────────────────────────────

interface ClassroomRowProps {
  classroom: Classroom;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (c: Pick<Classroom, "id" | "name" | "code">) => void;
}

const ClassroomRow = memo(function ClassroomRow({
  classroom: c,
  onView,
  onEdit,
  onDelete,
}: ClassroomRowProps) {
  const typeCfg = CLASSROOM_TYPE_CONFIG[c.type];
  const activeCfg = CLASSROOM_ACTIVE_CONFIG[c.isActive ? "true" : "false"];
  return (
    <tr className="group hover:bg-blue-50/40 transition-colors">
      {/* Classroom name + code */}
      <td className="px-4 py-3.5">
        <button onClick={() => onView(c.id)} className="flex items-center gap-3 text-left">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <DoorOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
              {c.name}
            </p>
            <span className="font-mono text-xs text-slate-400">{c.code}</span>
          </div>
        </button>
      </td>

      {/* Type */}
      <td className="hidden px-4 py-3.5 sm:table-cell">
        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", typeCfg.cls)}>
          {typeCfg.label}
        </span>
      </td>

      {/* Capacity */}
      <td className="hidden px-4 py-3.5 md:table-cell">
        <span className="text-sm text-slate-700 font-medium">{c.capacity}</span>
        <span className="ml-1 text-xs text-slate-400">chỗ</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
            activeCfg.cls
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", activeCfg.dot)} />
          {activeCfg.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => onView(c.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            aria-label="Xem chi tiết"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          <Can permission={PERMISSIONS.CLASSROOM_UPDATE}>
            <button
              onClick={() => onEdit(c.id)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              aria-label={`Chỉnh sửa ${c.name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          </Can>
          <Can permission={PERMISSIONS.CLASSROOM_DELETE}>
            <button
              onClick={() => onDelete({ id: c.id, name: c.name, code: c.code })}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
              aria-label={`Xoá ${c.name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </Can>
        </div>
      </td>
    </tr>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Classrooms() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { emitToast } = useToast();

  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [inputValue, setInputValue] = useState(search);
  const debouncedInput = useDebounce(inputValue, 400);

  const [deleteClassroom, setDeleteClassroom] = useState<Pick<
    Classroom,
    "id" | "name" | "code"
  > | null>(null);

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedInput) next.set("search", debouncedInput);
        else next.delete("search");
        next.delete("page");
        return next;
      },
      { replace: true }
    );
  }, [debouncedInput]);

  const {
    data: classroomsData,
    isLoading,
    isError,
  } = useClassrooms({ search, type, isActive, page });
  const isFiltered = Boolean(search || type || isActive);

  const deleteMutation = useDeleteClassroom();

  const handleView = useCallback((id: string) => navigate(`/classrooms/${id}`), [navigate]);
  const handleEdit = useCallback((id: string) => navigate(`/classrooms/${id}/edit`), [navigate]);
  const handleDeleteClick = useCallback(
    (c: Pick<Classroom, "id" | "name" | "code">) => setDeleteClassroom(c),
    [setDeleteClassroom]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Phòng học</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isLoading ? (
              <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200" />
            ) : (
              `${classroomsData?.meta.total ?? 0} phòng học`
            )}
          </p>
        </div>
        <Can permission={PERMISSIONS.CLASSROOM_CREATE}>
          <button
            onClick={() => navigate("/classrooms/new")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Thêm phòng học</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </Can>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tìm theo tên, mã phòng học..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("");
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete("search");
                    next.delete("page");
                    return next;
                  },
                  { replace: true }
                );
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={type}
          onChange={(e) => {
            const val = e.target.value;
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                if (val) next.set("type", val);
                else next.delete("type");
                next.delete("page");
                return next;
              },
              { replace: true }
            );
          }}
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">Tất cả loại phòng</option>
          {Object.entries(CLASSROOM_TYPE_CONFIG).map(([value, cfg]) => (
            <option key={value} value={value}>
              {cfg.label}
            </option>
          ))}
        </select>
        <select
          value={isActive}
          onChange={(e) => {
            const val = e.target.value;
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                if (val) next.set("isActive", val);
                else next.delete("isActive");
                next.delete("page");
                return next;
              },
              { replace: true }
            );
          }}
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Không hoạt động</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phòng học
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                  Loại phòng
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  Sức chứa
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
              ) : classroomsData?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <DoorOpen className="h-7 w-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {isFiltered ? "Không tìm thấy kết quả" : "Chưa có phòng học nào"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {isFiltered
                            ? "Thử thay đổi từ khoá hoặc bộ lọc"
                            : 'Nhấn "Thêm phòng học" để bắt đầu'}
                        </p>
                      </div>
                      {isFiltered && (
                        <button
                          onClick={() => {
                            setInputValue("");
                            setSearchParams({}, { replace: true });
                          }}
                          className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Xoá bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                classroomsData?.items.map((c) => (
                  <ClassroomRow
                    key={c.id}
                    classroom={c}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {classroomsData && classroomsData.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={classroomsData.meta.totalPages}
          total={classroomsData.meta.total}
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

      {/* ── Delete dialog ────────────────────────────────────────────────────── */}
      <DeleteDialog
        open={Boolean(deleteClassroom)}
        title="Xác nhận xoá phòng học"
        description={
          deleteClassroom
            ? `Bạn có chắc muốn xoá phòng học "${deleteClassroom.name}" (${deleteClassroom.code})? Dữ liệu sẽ bị ẩn khỏi hệ thống.`
            : undefined
        }
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteClassroom) return;
          deleteMutation.mutate(deleteClassroom.id, {
            onSuccess: () => {
              emitToast("Đã xoá phòng học", "success");
              setDeleteClassroom(null);
            },
            onError: (err) => {
              const msg = axios.isAxiosError(err)
                ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
                : "Có lỗi xảy ra";
              emitToast(msg, "error");
            },
          });
        }}
        onClose={() => setDeleteClassroom(null)}
      />
    </div>
  );
}
