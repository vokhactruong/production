import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "../api/students.api";
import { getData } from "../../../lib/api-client";
import { studentKeys } from "./query-keys";
import type { Student } from "../../../types";

export function useUpdateStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => studentsApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<Student>(studentKeys.detail(id), getData(response));
    },
  });
}
