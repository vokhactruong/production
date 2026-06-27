import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { articlesApi, getData } from "../../api/client";
import { formatDate } from "../../utils";
import type { Article } from "../../types";

export default function ArticlePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["article-preview", id],
    queryFn: () => articlesApi.getAdminOne(id!),
    enabled: Boolean(id),
  });

  const article = data ? getData<Article>(data) : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!article) return <div className="text-center text-slate-500">Không tìm thấy bài viết</div>;

  const cleanHtml = DOMPurify.sanitize(article.content);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          ← Quay lại
        </button>
        <span className="rounded-lg bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">Xem trước</span>
      </div>

      <article className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        {article.thumbnail && (
          <img src={article.thumbnail} alt={article.title} className="h-64 w-full object-cover" />
        )}

        <div className="p-8">
          {article.category && (
            <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {article.category.name}
            </span>
          )}

          <h1 className="mt-4 text-3xl font-bold text-slate-900">{article.title}</h1>

          {article.excerpt && (
            <p className="mt-3 text-lg text-slate-500">{article.excerpt}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {article.author && (
              <span>
                Tác giả: <strong className="text-slate-700">{article.author.firstName} {article.author.lastName}</strong>
              </span>
            )}
            {article.publishedAt && <span>Xuất bản: {formatDate(article.publishedAt)}</span>}
            <span>{article.viewCount} lượt xem</span>
          </div>

          {article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">#{tag}</span>
              ))}
            </div>
          )}

          <div
            className="prose prose-slate max-w-none mt-8"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        </div>
      </article>
    </div>
  );
}
