import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classroomsApi } from "../api/classrooms.api";
import { getData } from "../../../lib/api-client";
import { classroomKeys } from "./query-keys";
import type { Classroom } from "../../../types";

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => classroomsApi.create(data),
    onSuccess: (response) => {
      const created = getData<Classroom>(response);
      qc.setQueryData<Classroom>(classroomKeys.detail(created.id), created);
    },
  });
}
