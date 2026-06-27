import Link from "next/link";
import { API_URL } from "../lib/api";
import type { Article, Category } from "@school/types";

async function getArticles(page: number, categoryId?: string) {
  try {
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (categoryId) params.set("categoryId", categoryId);
    const res = await fetch(`${API_URL}/articles/public?${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok)
      return { items: [] as Article[], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } };
    const data = (await res.json()) as {
      data: {
        items: Article[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    };
    return data.data;
  } catch {
    return { items: [] as Article[], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } };
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: Category[] };
    return data.data;
  } catch {
    return [];
  }
}

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function TinTucPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const categorySlug = sp.category;

  const categories = await getCategories();
  const activeCategory = categorySlug ? categories.find((c) => c.slug === categorySlug) : null;
  const data = await getArticles(page, activeCategory?.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildUrl(p: number, cat?: string): any {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (cat) params.set("category", cat);
    const qs = params.toString();
    return `/tin-tuc${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-3xl font-bold text-slate-900">Tin tức & Blog</h1>
          <p className="mt-2 text-slate-500">
            Cập nhật kiến thức, xu hướng và câu chuyện từ EduCenter
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/tin-tuc"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                !activeCategory
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Tất cả
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildUrl(1, cat.slug)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory?.id === cat.id
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Articles grid */}
        {data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg
              className="mb-4 h-16 w-16 text-slate-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <p className="text-slate-400">Chưa có bài viết nào.</p>
            {activeCategory && (
              <Link
                href="/tin-tuc"
                className="mt-3 text-sm font-medium text-blue-600 hover:underline"
              >
                Xem tất cả tin tức
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((article) => (
                <article
                  key={article.id}
                  className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-all"
                >
                  {article.thumbnail ? (
                    <div className="overflow-hidden">
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                      <svg
                        className="h-12 w-12 text-blue-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    {article.category && (
                      <Link
                        href={buildUrl(1, article.category.slug)}
                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {article.category.name}
                      </Link>
                    )}
                    <h2 className="mt-2 font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <Link
                      href={`/bai-viet/${article.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Đọc thêm
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {data.meta.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl(page - 1, categorySlug)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                )}
                {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildUrl(p, categorySlug)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {page < data.meta.totalPages && (
                  <Link
                    href={buildUrl(page + 1, categorySlug)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
