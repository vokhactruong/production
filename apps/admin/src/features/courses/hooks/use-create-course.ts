import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../api/courses.api";
import { getData } from "../../../lib/api-client";
import { courseKeys } from "./query-keys";
import type { Course } from "../../../types";

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => coursesApi.create(data),
    onSuccess: (response) => {
      const created = getData<Course>(response);
      qc.setQueryData<Course>(courseKeys.detail(created.id), created);
    },
  });
}
