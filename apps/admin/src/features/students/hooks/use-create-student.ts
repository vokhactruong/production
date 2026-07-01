import { useMutation } from "@tanstack/react-query";
import { studentsApi } from "../api/students.api";

export function useCreateStudent() {
  return useMutation({
    mutationFn: (data: unknown) => studentsApi.create(data),
  });
}
