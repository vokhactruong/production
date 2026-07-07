import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "../api/enrollments.api";
import { getData } from "../../../lib/api-client";
import { enrollmentKeys } from "./query-keys";
import type { Enrollment } from "../../../types";

export function useUpdateEnrollment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => enrollmentsApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<Enrollment>(enrollmentKeys.detail(id), getData<Enrollment>(response));
    },
  });
}
