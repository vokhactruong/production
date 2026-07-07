import { useQuery } from "@tanstack/react-query";
import { classroomsApi } from "../api/classrooms.api";
import { getData } from "../../../lib/api-client";
import { classroomKeys } from "./query-keys";
import type { Classroom } from "../../../types";

export function useClassroom(id: string | undefined) {
  return useQuery({
    queryKey: classroomKeys.detail(id ?? ""),
    queryFn: () => classroomsApi.getOne(id!).then((res) => getData<Classroom>(res)),
    enabled: Boolean(id),
  });
}
