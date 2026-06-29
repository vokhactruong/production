import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../api/roles.api";
import { roleKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";

interface CreateRolePayload {
  name: string;
  description?: string;
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => rolesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
