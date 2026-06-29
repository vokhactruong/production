import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "../api/articles.api";
import { articleKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";

export function usePublishArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articlesApi.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
