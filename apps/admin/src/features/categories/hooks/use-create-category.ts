import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { categoryKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";

interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryPayload) => categoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
