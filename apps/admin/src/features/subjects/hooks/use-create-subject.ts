import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects.api";
import { subjectKeys } from "./query-keys";

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => subjectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
}
