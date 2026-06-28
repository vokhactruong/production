import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "../api/students.api";
import { getData } from "../../../lib/api-client";
import { studentKeys } from "./query-keys";
import type { Student } from "../../../types";

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: studentKeys.detail(id ?? ""),
    queryFn: () => studentsApi.getOne(id!).then((res) => getData<Student>(res)),
    enabled: Boolean(id),
  });
}
