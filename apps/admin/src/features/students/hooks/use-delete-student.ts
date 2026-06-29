import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "../api/students.api";
import { studentKeys } from "./query-keys";

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: studentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
