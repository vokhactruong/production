import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../api/courses.api";
import { getData } from "../../../lib/api-client";
import { courseKeys } from "./query-keys";
import type { Course } from "../../../types";

export function useUpdateCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => coursesApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<Course>(courseKeys.detail(id), getData<Course>(response));
      qc.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}
