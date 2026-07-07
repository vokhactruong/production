import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classSchedulesApi } from "../api/class-schedules.api";
import { getData } from "../../../lib/api-client";
import { classScheduleKeys } from "./query-keys";
import type { ClassSchedule } from "../../../types";

export function useUpdateClassSchedule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => classSchedulesApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<ClassSchedule>(
        classScheduleKeys.detail(id),
        getData<ClassSchedule>(response)
      );
    },
  });
}
