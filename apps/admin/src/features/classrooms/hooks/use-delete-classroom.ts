import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classroomsApi } from "../api/classrooms.api";
import { classroomKeys } from "./query-keys";

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classroomsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: classroomKeys.detail(id) });
      qc.invalidateQueries({ queryKey: classroomKeys.lists() });
    },
  });
}
