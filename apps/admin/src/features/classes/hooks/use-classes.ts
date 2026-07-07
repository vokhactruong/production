import { useQuery } from "@tanstack/react-query";
import { classesApi } from "../api/classes.api";
import { getList } from "../../../lib/api-client";
import { classKeys } from "./query-keys";
import type { Class } from "../../../types";

interface ClassFilters {
  search?: string;
  status?: string;
  courseId?: string;
  page?: number;
}

export function useClasses(filters: ClassFilters) {
  return useQuery({
    queryKey: classKeys.list(filters),
    queryFn: () =>
      classesApi
        .getAll({
          search: filters.search || undefined,
          status: filters.status || undefined,
          courseId: filters.courseId || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Class>(res)),
  });
}
