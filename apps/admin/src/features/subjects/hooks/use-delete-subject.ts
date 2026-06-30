import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects.api";
import { subjectKeys } from "./query-keys";

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: subjectKeys.detail(id) });
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
}
