import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classSessionsApi } from "../api/class-sessions.api";
import { getData } from "../../../lib/api-client";
import { classSessionKeys } from "./query-keys";
import type { ClassSession } from "../../../types";

export function useUpdateClassSession(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => classSessionsApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<ClassSession>(classSessionKeys.detail(id), getData<ClassSession>(response));
    },
  });
}
