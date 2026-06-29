import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../api/roles.api";
import { roleKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
