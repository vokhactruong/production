import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { categoriesApi, getData } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { PERMISSIONS } from "../constants/permissions";
import { useToast } from "../components/Toast";
import Can from "../components/Can";
import { formatDate } from "../utils";
import type { Category } from "../types";
import axios from "axios";
import slugify from "slugify";

export default function Categories() {
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const { hasPermission } = useAuthStore();
  const [modal, setModal] = useState<{ mode: "create" | "edit"; cat?: Category } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
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

  const saveMutation = useMutation({
    mutationFn: () =>
      modal?.mode === "create"
        ? categoriesApi.create({ name: formName, description: formDesc || undefined })
        : categoriesApi.update(modal!.cat!.id, {
            name: formName,
            description: formDesc || undefined,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      emitToast(
        modal?.mode === "create" ? "Tạo danh mục thành công" : "Cập nhật thành công",
        "success"
      );
      setModal(null);
    },
    onError: (err) => {
      emitToast(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
          : "Có lỗi",
        "error"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
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
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Danh mục</h2>
          <p className="mt-1 text-sm text-slate-500">{categories.length} danh mục</p>
        </div>
        <Can permission="category.create">
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
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Đang tải...
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
                      <Can permission="category.update">
                        <button
                          onClick={() => openEdit(cat)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Can>
                      <Can permission="category.delete">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {modal.mode === "create" ? "Tạo danh mục" : "Sửa danh mục"}
              </h2>
              <button onClick={() => setModal(null)} className="rounded-lg p-1 hover:bg-slate-100">
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="p-6 flex flex-col gap-4"
            >
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
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-semibold">Xóa danh mục?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Danh mục không thể xóa nếu còn bài viết đang dùng.
            </p>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
