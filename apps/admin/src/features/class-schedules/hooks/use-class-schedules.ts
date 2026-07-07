import { useQuery } from "@tanstack/react-query";
import { classSchedulesApi } from "../api/class-schedules.api";
import { getData } from "../../../lib/api-client";
import { classScheduleKeys } from "./query-keys";
import type { ClassSchedule } from "../../../types";

export function useClassSchedules(classId: string | undefined) {
  return useQuery({
    queryKey: classScheduleKeys.list({ classId }),
    queryFn: () =>
      classSchedulesApi.getAll({ classId }).then((res) => getData<ClassSchedule[]>(res)),
    enabled: Boolean(classId),
  });
}
