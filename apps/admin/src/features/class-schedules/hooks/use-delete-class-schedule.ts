import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classSchedulesApi } from "../api/class-schedules.api";
import { classScheduleKeys } from "./query-keys";

export function useDeleteClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classSchedulesApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: classScheduleKeys.detail(id) });
      qc.invalidateQueries({ queryKey: classScheduleKeys.lists() });
    },
  });
}
