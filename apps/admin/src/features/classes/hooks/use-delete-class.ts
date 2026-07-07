import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "../api/classes.api";
import { classKeys } from "./query-keys";

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: classKeys.detail(id) });
      qc.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}
