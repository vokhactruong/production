import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classroomsApi } from "../api/classrooms.api";
import { getData } from "../../../lib/api-client";
import { classroomKeys } from "./query-keys";
import type { Classroom } from "../../../types";

export function useUpdateClassroom(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => classroomsApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<Classroom>(classroomKeys.detail(id), getData<Classroom>(response));
    },
  });
}
