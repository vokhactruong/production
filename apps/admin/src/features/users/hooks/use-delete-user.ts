import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users.api";
import { userKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
