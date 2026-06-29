import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { categoryKeys } from "./query-keys";

interface UpdateCategoryPayload {
  name: string;
  description?: string;
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCategoryPayload) => categoriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}
