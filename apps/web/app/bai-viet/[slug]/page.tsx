import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { API_URL } from "../../lib/api";
import type { Article } from "@school/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_URL}/articles/public/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json() as { data: Article };
    return data.data;
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const cleanHtml = DOMPurify.sanitize(article.content);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <article>
        {article.category && (
          <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {article.category.name}
          </span>
        )}
        <h1 className="mt-4 text-3xl font-bold text-slate-900">{article.title}</h1>
        {article.excerpt && <p className="mt-3 text-lg text-slate-500">{article.excerpt}</p>}
        {article.thumbnail && <img src={article.thumbnail} alt={article.title} className="mt-6 w-full rounded-2xl object-cover" />}
        <div className="prose prose-slate max-w-none mt-8" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
      </article>
    </main>
  );
}
