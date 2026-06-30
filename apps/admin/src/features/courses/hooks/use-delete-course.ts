import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../api/courses.api";
import { courseKeys } from "./query-keys";

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: courseKeys.detail(id) });
      qc.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}
