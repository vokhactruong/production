import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "../api/courses.api";
import { getList } from "../../../lib/api-client";
import { courseKeys } from "./query-keys";
import type { Course } from "../../../types";

interface CourseFilters {
  search?: string;
  subjectId?: string;
  status?: string;
  page?: number;
}

export function useCourses(filters: CourseFilters) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () =>
      coursesApi
        .getAll({
          search: filters.search || undefined,
          subjectId: filters.subjectId || undefined,
          status: filters.status || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Course>(res)),
  });
}
