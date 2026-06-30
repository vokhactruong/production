import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "../api/courses.api";
import { getData } from "../../../lib/api-client";
import { courseKeys } from "./query-keys";
import type { Course } from "../../../types";

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(id ?? ""),
    queryFn: () => coursesApi.getOne(id!).then((res) => getData<Course>(res)),
    enabled: Boolean(id),
  });
}
