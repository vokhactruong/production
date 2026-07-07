import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "../api/enrollments.api";
import { enrollmentKeys } from "./query-keys";

export function useDeleteEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: enrollmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
    },
  });
}
