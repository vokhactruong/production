import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Archive,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DeleteDialog } from "../../components/DeleteDialog";
import { articlesApi } from "../../features/articles/api/articles.api";
import { categoriesApi } from "../../features/categories/api/categories.api";
import { articleKeys } from "../../features/articles/hooks/query-keys";
import { categoryKeys } from "../../features/categories/hooks/query-keys";
import { usePublishArticle } from "../../features/articles/hooks/use-publish-article";
import { useUnpublishArticle } from "../../features/articles/hooks/use-unpublish-article";
import { useArchiveArticle } from "../../features/articles/hooks/use-archive-article";
import { useDeleteArticle } from "../../features/articles/hooks/use-delete-article";
import { getData, getList } from "../../lib/api-client";
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
  DRAFT: "Nháp",
  REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Lưu trữ",
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-16 shrink-0 rounded-lg bg-slate-200" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-40 rounded bg-slate-200" />
            <div className="h-3 w-28 rounded bg-slate-200" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 rounded-full bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <div className="h-3.5 w-20 rounded bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <div className="h-3.5 w-20 rounded bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <div className="h-3.5 w-8 rounded bg-slate-200" />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <div className="h-3 w-20 rounded bg-slate-200" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
          <div className="h-7 w-7 rounded-lg bg-slate-200" />
        </div>
      </td>
    </tr>
  );
}

export default function ArticleList() {
  const navigate = useNavigate();
  const { emitToast } = useToast();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useQuery({
    queryKey: articleKeys.list({
      search: debouncedSearch || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
      page,
    }),
    queryFn: () =>
      articlesApi.getAdminList({
        search: debouncedSearch || undefined,
        status: status || undefined,
        categoryId: categoryId || undefined,
        page,
        limit: 10,
      }),
  });
  const { data: catsData } = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => categoriesApi.getAll(),
    enabled: hasPermission(PERMISSIONS.CATEGORY_READ),
  });

  const articlesData = data ? getList<Article>(data) : null;
  const categories = catsData ? getData<Category[]>(catsData) : [];

  const publishMutation = usePublishArticle();
  const unpublishMutation = useUnpublishArticle();
  const archiveMutation = useArchiveArticle();
  const deleteMutation = useDeleteArticle();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bài viết</h2>
          <p className="mt-1 text-sm text-slate-500">{articlesData?.meta.total ?? 0} bài viết</p>
        </div>
        <Can permission={PERMISSIONS.ARTICLE_CREATE}>
          <button
            onClick={() => navigate("/articles/new")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tạo bài mới</span>
          </button>
        </Can>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm bài viết..."
            className="h-10 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="REVIEW">Chờ duyệt</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="ARCHIVED">Lưu trữ</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  Danh mục
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  Tác giả
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                  Lượt xem
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                  Ngày xuất bản
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
                  <td colSpan={7} className="py-20 text-center">
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
              ) : articlesData?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không có bài viết
                  </td>
                </tr>
              ) : (
                articlesData?.items.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.thumbnail && (
                          <img
                            src={article.thumbnail}
                            alt=""
                            className="h-10 w-16 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <span className="font-medium text-slate-900">
                          {truncate(article.title, 60)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-0.5 text-xs font-medium",
                          STATUS_BADGE[article.status]
                        )}
                      >
                        {STATUS_LABEL[article.status]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      {article.category?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      {article.author
                        ? `${article.author.firstName} ${article.author.lastName}`
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {article.viewCount}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {formatDate(article.publishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/articles/${article.id}/preview`)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                          title="Xem trước"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Can permission={PERMISSIONS.ARTICLE_UPDATE}>
                          <button
                            onClick={() => navigate(`/articles/${article.id}/edit`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                            title="Sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Can>
                        <Can permission={PERMISSIONS.ARTICLE_PUBLISH}>
                          {article.status === "PUBLISHED" ? (
                            <button
                              onClick={() =>
                                unpublishMutation.mutate(article.id, {
                                  onSuccess: () => emitToast("Đã gỡ xuất bản", "success"),
                                  onError: () => emitToast("Có lỗi xảy ra", "error"),
                                })
                              }
                              className="rounded-lg p-1.5 text-yellow-600 hover:bg-yellow-50 text-xs font-medium transition-colors"
                              title="Gỡ xuất bản"
                            >
                              Gỡ
                            </button>
                          ) : article.status !== "ARCHIVED" ? (
                            <button
                              onClick={() =>
                                publishMutation.mutate(article.id, {
                                  onSuccess: () => emitToast("Đã xuất bản", "success"),
                                  onError: () => emitToast("Có lỗi xảy ra", "error"),
                                })
                              }
                              className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 text-xs font-medium transition-colors"
                              title="Xuất bản"
                            >
                              XB
                            </button>
                          ) : null}
                        </Can>
                        <Can permission={PERMISSIONS.ARTICLE_MANAGE}>
                          {article.status !== "ARCHIVED" && (
                            <button
                              onClick={() =>
                                archiveMutation.mutate(article.id, {
                                  onSuccess: () => emitToast("Đã lưu trữ", "success"),
                                  onError: () => emitToast("Có lỗi xảy ra", "error"),
                                })
                              }
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                              title="Lưu trữ"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                        </Can>
                        <Can permission={PERMISSIONS.ARTICLE_DELETE}>
                          <button
                            onClick={() => setDeleteId(article.id)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                            title="Xoá"
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
      </div>

      {/* Pagination */}
      {articlesData && articlesData.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {/* Mobile: compact */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-600">
              Trang {page} / {articlesData.meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(articlesData.meta.totalPages, p + 1))}
              disabled={page === articlesData.meta.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {/* Desktop: full */}
          <div className="hidden sm:flex gap-1">
            {Array.from(
              { length: Math.min(articlesData.meta.totalPages, 10) },
              (_, i) => i + 1
            ).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                  page === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        title="Xóa bài viết?"
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(deleteId!, {
            onSuccess: () => {
              emitToast("Đã xóa bài viết", "success");
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
