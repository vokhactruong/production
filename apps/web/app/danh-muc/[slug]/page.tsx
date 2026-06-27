import { notFound } from "next/navigation";
import Link from "next/link";
import { API_URL } from "../../lib/api";
import type { Article, Category } from "@school/types";

interface Props {
  params: Promise<{ slug: string }>;
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

async function getArticlesByCategory(categoryId: string) {
  try {
    const res = await fetch(`${API_URL}/articles/public?categoryId=${categoryId}&limit=12`, {
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

export default async function DanhMucPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const articlesData = await getArticlesByCategory(category.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Link href="/tin-tuc" className="text-sm text-slate-500 hover:text-slate-700">
          ← Tất cả tin tức
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{category.name}</h1>
        {category.description && <p className="mt-2 text-slate-500">{category.description}</p>}
      </div>
      {articlesData.items.length === 0 ? (
        <p className="text-center text-slate-400">Chưa có bài viết nào trong danh mục này.</p>
      ) : (
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
                <h2 className="font-semibold text-slate-900 line-clamp-2">{article.title}</h2>
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
      )}
    </main>
  );
}
