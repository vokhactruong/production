import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classSchedulesApi } from "../api/class-schedules.api";
import { getData } from "../../../lib/api-client";
import { classScheduleKeys } from "./query-keys";
import type { ClassSchedule } from "../../../types";

export function useCreateClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => classSchedulesApi.create(data),
    onSuccess: (response) => {
      const created = getData<ClassSchedule>(response);
      qc.setQueryData<ClassSchedule>(classScheduleKeys.detail(created.id), created);
    },
  });
}
