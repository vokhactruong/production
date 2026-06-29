import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../api/roles.api";
import { roleKeys } from "./query-keys";

interface UpdateRolePayload {
  name: string;
  description?: string;
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRolePayload) => rolesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}
