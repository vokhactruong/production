import Link from "next/link";
import { API_URL } from "./lib/api";
import type { Article, Category } from "@school/types";

async function getArticles() {
  try {
    const res = await fetch(`${API_URL}/articles/public?limit=6`, { next: { revalidate: 60 } });
    if (!res.ok) return { items: [], meta: { total: 0, page: 1, limit: 6, totalPages: 0 } };
    const data = await res.json() as { data: { items: Article[]; meta: { total: number; page: number; limit: number; totalPages: number } } };
    return data.data;
  } catch {
    return { items: [], meta: { total: 0, page: 1, limit: 6, totalPages: 0 } };
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json() as { data: Category[] };
    return data.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [articlesData, categories] = await Promise.all([getArticles(), getCategories()]);

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">Cổng Thông Tin Giáo Dục</h1>
          <p className="mt-4 text-xl text-blue-100">Tin tức, sự kiện và thông báo từ nhà trường</p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/tin-tuc" className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                Tất cả
              </Link>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/danh-muc/${cat.slug}`} className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">Tin tức mới nhất</h2>
        {articlesData.items.length === 0 ? (
          <p className="text-center text-slate-400">Chưa có bài viết nào.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articlesData.items.map((article) => (
              <article key={article.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                {article.thumbnail && (
                  <img src={article.thumbnail} alt={article.title} className="h-48 w-full object-cover" />
                )}
                <div className="p-5">
                  {article.category && (
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {article.category.name}
                    </span>
                  )}
                  <h3 className="mt-2 font-semibold text-slate-900 line-clamp-2">{article.title}</h3>
                  {article.excerpt && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
                  )}
                  <Link href={`/bai-viet/${article.slug}`} className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
                    Đọc thêm →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
