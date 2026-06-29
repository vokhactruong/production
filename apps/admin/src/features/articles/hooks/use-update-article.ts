import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "../api/articles.api";
import { getData } from "../../../lib/api-client";
import { articleKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";
import type { Article, ArticleStatus } from "../../../types";

export interface UpdateArticlePayload {
  title: string;
  excerpt?: string;
  content: string;
  thumbnail: string | null;
  thumbnailPublicId: string | null;
  categoryId?: string;
  tags: string[];
  status: ArticleStatus;
}

export function useUpdateArticle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateArticlePayload) => articlesApi.update(id, payload),
    onSuccess: (response) => {
      qc.setQueryData(articleKeys.detail(id), getData<Article>(response));
      qc.invalidateQueries({ queryKey: articleKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
