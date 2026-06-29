import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { categoryKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
