import { useQuery } from "@tanstack/react-query";
import { classroomsApi } from "../api/classrooms.api";
import { getList } from "../../../lib/api-client";
import { classroomKeys } from "./query-keys";
import type { Classroom } from "../../../types";

interface ClassroomFilters {
  search?: string;
  type?: string;
  isActive?: string;
  page?: number;
}

export function useClassrooms(filters: ClassroomFilters) {
  return useQuery({
    queryKey: classroomKeys.list(filters),
    queryFn: () =>
      classroomsApi
        .getAll({
          search: filters.search || undefined,
          type: filters.type || undefined,
          isActive: filters.isActive || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Classroom>(res)),
  });
}
