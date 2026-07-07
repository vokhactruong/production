import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "../api/enrollments.api";
import { getData } from "../../../lib/api-client";
import { enrollmentKeys } from "./query-keys";
import type { Enrollment } from "../../../types";

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => enrollmentsApi.create(data),
    onSuccess: (response) => {
      const created = getData<Enrollment>(response);
      qc.setQueryData<Enrollment>(enrollmentKeys.detail(created.id), created);
    },
  });
}
