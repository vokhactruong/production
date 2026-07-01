import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "../api/articles.api";
import { getData } from "../../../lib/api-client";
import { articleKeys } from "./query-keys";
import type { Article } from "../../../types";

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: articleKeys.detail(id ?? ""),
    queryFn: () => articlesApi.getAdminOne(id!).then((res) => getData<Article>(res)),
    enabled: Boolean(id),
  });
}
