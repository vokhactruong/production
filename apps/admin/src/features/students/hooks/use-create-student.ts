import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "../api/students.api";
import { studentKeys } from "./query-keys";

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => studentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
