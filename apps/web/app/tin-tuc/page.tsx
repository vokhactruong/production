import Link from "next/link";
import { API_URL } from "../lib/api";
import type { Article } from "@school/types";

async function getArticles(page = 1) {
  try {
    const res = await fetch(`${API_URL}/articles/public?page=${page}&limit=12`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { items: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } };
    const data = (await res.json()) as {
      data: {
        items: Article[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    };
    return data.data;
  } catch {
    return { items: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } };
  }
}

export default async function TinTucPage() {
  const articlesData = await getArticles();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Tin tức</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articlesData.items.map((article) => (
          <article
            key={article.id}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
          >
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt={article.title}
                className="h-48 w-full object-cover"
              />
            )}
            <div className="p-5">
              {article.category && (
                <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {article.category.name}
                </span>
              )}
              <h2 className="mt-2 font-semibold text-slate-900 line-clamp-2">{article.title}</h2>
              {article.excerpt && (
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
              )}
              <Link
                href={`/bai-viet/${article.slug}`}
                className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                Đọc thêm →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
