import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "../api/articles.api";
import { articleKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateArticlePayload) => articlesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
