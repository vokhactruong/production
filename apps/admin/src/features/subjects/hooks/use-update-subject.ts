import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects.api";
import { getData } from "../../../lib/api-client";
import { subjectKeys } from "./query-keys";
import type { Subject } from "../../../types";

export function useUpdateSubject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => subjectsApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<Subject>(subjectKeys.detail(id), getData(response));
      qc.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
}
