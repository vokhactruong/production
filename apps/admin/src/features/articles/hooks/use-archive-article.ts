import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "../api/articles.api";
import { articleKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";

export function useArchiveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articlesApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
