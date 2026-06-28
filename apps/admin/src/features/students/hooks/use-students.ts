import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "../api/students.api";
import { getList } from "../../../lib/api-client";
import { studentKeys } from "./query-keys";
import type { Student } from "../../../types";

interface StudentFilters {
  search?: string;
  status?: string;
  page?: number;
}

export function useStudents(filters: StudentFilters) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () =>
      studentsApi
        .getAll({
          search: filters.search || undefined,
          status: filters.status || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Student>(res)),
  });
}
