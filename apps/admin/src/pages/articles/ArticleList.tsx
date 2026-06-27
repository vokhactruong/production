import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Eye, Archive } from "lucide-react";
import { articlesApi, categoriesApi, getData, getList } from "../../api/client";
import { useAuthStore } from "../../store/auth.store";
import { PERMISSIONS } from "../../constants/permissions";
import { useToast } from "../../components/Toast";
import Can from "../../components/Can";
import { cn, formatDate, truncate } from "../../utils";
import { useDebounce } from "../../hooks";
import type { Article, Category } from "../../types";
import axios from "axios";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  REVIEW: "bg-yellow-100 text-yellow-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp", REVIEW: "Chờ duyệt", PUBLISHED: "Đã xuất bản", ARCHIVED: "Lưu trữ",
};

export default function ArticleList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["articles-admin", debouncedSearch, status, categoryId, page],
    queryFn: () => articlesApi.getAdminList({ search: debouncedSearch || undefined, status: status || undefined, categoryId: categoryId || undefined, page, limit: 10 }),
  });
  const { data: catsData } = useQuery({ queryKey: ["categories"], queryFn: () => categoriesApi.getAll(), enabled: hasPermission(PERMISSIONS.CATEGORY_READ) });

  const articlesData = data ? getList<Article>(data) : null;
  const categories = catsData ? getData<Category[]>(catsData) : [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => articlesApi.publish(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["articles-admin"] }); emitToast("Đã xuất bản", "success"); },
    onError: () => emitToast("Có lỗi xảy ra", "error"),
  });
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => articlesApi.unpublish(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["articles-admin"] }); emitToast("Đã gỡ xuất bản", "success"); },
    onError: () => emitToast("Có lỗi xảy ra", "error"),
  });
  const archiveMutation = useMutation({
    mutationFn: (id: string) => articlesApi.archive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["articles-admin"] }); emitToast("Đã lưu trữ", "success"); },
    onError: () => emitToast("Có lỗi xảy ra", "error"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => articlesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["articles-admin"] }); emitToast("Đã xóa bài viết", "success"); setDeleteId(null); },
    onError: (err) => { emitToast(axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message ?? "Có lỗi" : "Có lỗi", "error"); },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bài viết</h2>
          <p className="mt-1 text-sm text-slate-500">{articlesData?.meta.total ?? 0} bài viết</p>
        </div>
        <Can permission="article.create">
          <button onClick={() => navigate("/articles/new")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Tạo bài mới
          </button>
        </Can>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm bài viết..." className="h-10 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="REVIEW">Chờ duyệt</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tác giả</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lượt xem</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày xuất bản</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">Đang tải...</td></tr>
            ) : articlesData?.items.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">Không có bài viết</td></tr>
            ) : articlesData?.items.map((article) => (
              <tr key={article.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {article.thumbnail && (
                      <img src={article.thumbnail} alt="" className="h-10 w-16 rounded-lg object-cover shrink-0" />
                    )}
                    <span className="font-medium text-slate-900">{truncate(article.title, 60)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-lg px-2.5 py-0.5 text-xs font-medium", STATUS_BADGE[article.status])}>
                    {STATUS_LABEL[article.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{article.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {article.author ? `${article.author.firstName} ${article.author.lastName}` : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{article.viewCount}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(article.publishedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/articles/${article.id}/preview`)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Xem trước">
                      <Eye className="h-4 w-4" />
                    </button>
                    <Can permission="article.update">
                      <button onClick={() => navigate(`/articles/${article.id}/edit`)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Sửa">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Can>
                    <Can permission="article.publish">
                      {article.status === "PUBLISHED" ? (
                        <button onClick={() => unpublishMutation.mutate(article.id)} className="rounded-lg p-1.5 text-yellow-600 hover:bg-yellow-50 text-xs font-medium">Gỡ</button>
                      ) : article.status !== "ARCHIVED" ? (
                        <button onClick={() => publishMutation.mutate(article.id)} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 text-xs font-medium">XB</button>
                      ) : null}
                    </Can>
                    <Can permission="article.manage">
                      {article.status !== "ARCHIVED" && (
                        <button onClick={() => archiveMutation.mutate(article.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Lưu trữ">
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </Can>
                    <Can permission="article.delete">
                      <button onClick={() => setDeleteId(article.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {articlesData && articlesData.meta.totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: Math.min(articlesData.meta.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-sm", page === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100")}>{p}</button>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-semibold">Xóa bài viết?</h3>
            <p className="mt-2 text-sm text-slate-500">Hành động này không thể hoàn tác.</p>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Huỷ</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
