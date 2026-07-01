import { useMutation } from "@tanstack/react-query";
import { articlesApi } from "../api/articles.api";
import type { ArticleStatus } from "../../../types";

export interface CreateArticlePayload {
  title: string;
  excerpt?: string;
  content: string;
  thumbnail?: string;
  thumbnailPublicId?: string;
  categoryId?: string;
  tags: string[];
  status: ArticleStatus;
}

export function useCreateArticle() {
  return useMutation({
    mutationFn: (payload: CreateArticlePayload) => articlesApi.create(payload),
  });
}
