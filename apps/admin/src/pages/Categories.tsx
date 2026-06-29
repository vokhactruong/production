import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { DeleteDialog } from "../components/DeleteDialog";
import { categoriesApi } from "../features/categories/api/categories.api";
import { categoryKeys } from "../features/categories/hooks/query-keys";
import { useCreateCategory } from "../features/categories/hooks/use-create-category";
import { useUpdateCategory } from "../features/categories/hooks/use-update-category";
import { useDeleteCategory } from "../features/categories/hooks/use-delete-category";
import { getData } from "../lib/api-client";
import { useAuthStore } from "../store/auth.store";
import { PERMISSIONS } from "../constants/permissions";
import { useToast } from "../components/Toast";
import Can from "../components/Can";
import { formatDate } from "../utils";
import type { Category } from "../types";
import axios from "axios";
import slugify from "slugify";

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 w-24 rounded bg-slate-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 w-8 rounded bg-slate-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 rounded bg-slate-200" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
        </div>
      </td>
    </tr>
  );
}

export default function Categories() {
  const { emitToast } = useToast();
  const { hasPermission } = useAuthStore();
  const [modal, setModal] = useState<{ mode: "create" | "edit"; cat?: Category } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => categoriesApi.getAll(),
    enabled: hasPermission(PERMISSIONS.CATEGORY_READ),
  });
  const categories = data ? getData<(Category & { _count?: { articles: number } })[]>(data) : [];

  const slugPreview = formName
    ? slugify(formName, { lower: true, strict: true, locale: "vi" })
    : "";

  const openCreate = () => {
    setFormName("");
    setFormDesc("");
    setModal({ mode: "create" });
  };
  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormDesc(cat.description ?? "");
    setModal({ mode: "edit", cat });
  };

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(modal?.cat?.id ?? "");
  const deleteMutation = useDeleteCategory();

  const savePending =
    modal?.mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: formName, description: formDesc || undefined };
    const onSuccess = () => {
      emitToast(
        modal?.mode === "create" ? "Tạo danh mục thành công" : "Cập nhật thành công",
        "success"
      );
      setModal(null);
    };
    const onError = (err: unknown) => {
      emitToast(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
          : "Có lỗi",
        "error"
      );
    };
    if (modal?.mode === "create") createMutation.mutate(data, { onSuccess, onError });
    else updateMutation.mutate(data, { onSuccess, onError });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Danh mục</h2>
          <p className="mt-1 text-sm text-slate-500">{categories.length} danh mục</p>
        </div>
        <Can permission={PERMISSIONS.CATEGORY_CREATE}>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Tạo danh mục
          </button>
        </Can>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tên
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bài viết
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : isError ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
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
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{cat._count?.articles ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(cat.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Can permission={PERMISSIONS.CATEGORY_UPDATE}>
                        <button
                          onClick={() => openEdit(cat)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Can>
                      <Can permission={PERMISSIONS.CATEGORY_DELETE}>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={!savePending ? () => setModal(null) : undefined}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {modal.mode === "create" ? "Tạo danh mục" : "Sửa danh mục"}
              </h2>
              <button
                onClick={() => setModal(null)}
                disabled={savePending}
                className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-40"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tên danh mục
                </label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {slugPreview && (
                  <p className="mt-1 text-xs text-slate-500">
                    Slug: <code>{slugPreview}</code>
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  disabled={savePending}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={savePending}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savePending ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        title="Xóa danh mục?"
        description="Danh mục không thể xóa nếu còn bài viết đang dùng."
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(deleteId!, {
            onSuccess: () => {
              emitToast("Đã xóa danh mục", "success");
              setDeleteId(null);
            },
            onError: (err) => {
              emitToast(
                axios.isAxiosError(err)
                  ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
                  : "Có lỗi",
                "error"
              );
            },
          })
        }
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
