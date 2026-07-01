import { useMutation } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects.api";

export function useCreateSubject() {
  return useMutation({
    mutationFn: (data: unknown) => subjectsApi.create(data),
  });
}
