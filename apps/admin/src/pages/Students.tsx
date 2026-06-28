import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Eye,
  AlertCircle,
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { studentsApi, getList } from "../api/client";
import { useToast } from "../components/Toast";
import Can from "../components/Can";
import { PERMISSIONS } from "../constants/permissions";
import { cn, formatDate, getInitials } from "../utils";
import { useDebounce } from "../hooks";
import { STATUS_CONFIG, GENDER_LABEL } from "./students/constants";
import type { Student } from "../types";

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
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-24 rounded-md bg-slate-200" />
          <div className="h-3 w-32 rounded-md bg-slate-200" />
        </div>
      </td>
      <td className="hidden px-4 py-3.5 lg:table-cell">
        <div className="h-3.5 w-24 rounded-md bg-slate-200" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-5 w-20 rounded-lg bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3.5 md:table-cell">
        <div className="h-3.5 w-16 rounded-md bg-slate-200" />
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
        {from}–{to} / {total} học sinh
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

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  student,
  isPending,
  onConfirm,
  onCancel,
}: {
  student: Pick<Student, "id" | "firstName" | "lastName" | "code">;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isPending ? onCancel : undefined}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-red-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-sm font-semibold text-slate-900">
              Xác nhận xoá
            </h3>
            <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xoá học sinh{" "}
            <span className="font-semibold text-slate-900">
              {student.firstName} {student.lastName}
            </span>
            {student.code && (
              <span className="ml-1 font-mono text-xs text-slate-500">({student.code})</span>
            )}
            ?
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Dữ liệu học sinh sẽ bị ẩn khỏi hệ thống và không thể khôi phục.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Đang xoá..." : "Xoá học sinh"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Students() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deleteStudent, setDeleteStudent] = useState<Pick<
    Student,
    "id" | "firstName" | "lastName" | "code"
  > | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", debouncedSearch, status, page],
    queryFn: () =>
      studentsApi.getAll({
        search: debouncedSearch || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  const studentsData = data ? getList<Student>(data) : null;
  const isFiltered = Boolean(search || status);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      emitToast("Đã xoá học sinh", "success");
      setDeleteStudent(null);
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    },
  });

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Học sinh</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isLoading ? (
              <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200" />
            ) : (
              `${studentsData?.meta.total ?? 0} học sinh`
            )}
          </p>
        </div>
        <Can permission={PERMISSIONS.STUDENT_CREATE}>
          <button
            onClick={() => navigate("/students/new")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Thêm học sinh</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </Can>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="SUSPENDED">Bị khoá</option>
        </select>
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
                  Liên hệ
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                  Phụ huynh
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  Ngày tạo
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
                  <td colSpan={6} className="py-20 text-center">
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
              ) : studentsData?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <GraduationCap className="h-7 w-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {isFiltered ? "Không tìm thấy kết quả" : "Chưa có học sinh nào"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {isFiltered
                            ? "Thử thay đổi từ khoá hoặc bộ lọc"
                            : 'Nhấn "Thêm học sinh" để bắt đầu'}
                        </p>
                      </div>
                      {isFiltered && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatus("");
                            setPage(1);
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
                studentsData?.items.map((s) => (
                  <tr key={s.id} className="group hover:bg-blue-50/40 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => navigate(`/students/${s.id}`)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-semibold text-white shadow-sm">
                          {s.avatar ? (
                            <img
                              src={s.avatar}
                              alt={`${s.firstName} ${s.lastName}`}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            getInitials(s.firstName, s.lastName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {s.firstName} {s.lastName}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {s.code && (
                              <span className="font-mono text-xs text-slate-400">{s.code}</span>
                            )}
                            {s.dateOfBirth && (
                              <span className="text-xs text-slate-400">
                                {s.code ? "· " : ""}
                                {s.gender ? GENDER_LABEL[s.gender] + ", " : ""}
                                {formatDate(s.dateOfBirth)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </td>

                    {/* Contact */}
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {s.phone ? <span className="text-slate-700">{s.phone}</span> : null}
                        {s.email ? <span className="text-xs text-slate-500">{s.email}</span> : null}
                        {!s.phone && !s.email && <span className="text-slate-300">—</span>}
                      </div>
                    </td>

                    {/* Guardian */}
                    <td className="hidden px-4 py-3.5 lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {s.guardianName ? (
                          <span className="text-slate-700">{s.guardianName}</span>
                        ) : null}
                        {s.guardianPhone ? (
                          <span className="text-xs text-slate-500">{s.guardianPhone}</span>
                        ) : null}
                        {!s.guardianName && !s.guardianPhone && (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                          STATUS_CONFIG[s.status].cls
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[s.status].dot)}
                        />
                        {STATUS_CONFIG[s.status].label}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="hidden px-4 py-3.5 text-sm text-slate-500 md:table-cell">
                      {formatDate(s.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => navigate(`/students/${s.id}`)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                          aria-label="Xem hồ sơ"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <Can permission={PERMISSIONS.STUDENT_UPDATE}>
                          <button
                            onClick={() => navigate(`/students/${s.id}/edit`)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            aria-label={`Chỉnh sửa ${s.firstName} ${s.lastName}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </Can>
                        <Can permission={PERMISSIONS.STUDENT_DELETE}>
                          <button
                            onClick={() =>
                              setDeleteStudent({
                                id: s.id,
                                firstName: s.firstName,
                                lastName: s.lastName,
                                code: s.code,
                              })
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                            aria-label={`Xoá ${s.firstName} ${s.lastName}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {studentsData && studentsData.meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={studentsData.meta.totalPages}
          total={studentsData.meta.total}
          limit={10}
          onPageChange={setPage}
        />
      )}

      {/* ── Delete dialog ────────────────────────────────────────────────────── */}
      {deleteStudent && (
        <DeleteDialog
          student={deleteStudent}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteStudent.id)}
          onCancel={() => setDeleteStudent(null)}
        />
      )}
    </div>
  );
}
