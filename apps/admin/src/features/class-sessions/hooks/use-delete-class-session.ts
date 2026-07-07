import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classSessionsApi } from "../api/class-sessions.api";
import { classSessionKeys } from "./query-keys";

export function useDeleteClassSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classSessionsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: classSessionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: classSessionKeys.lists() });
    },
  });
}
