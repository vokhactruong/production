import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../api/roles.api";
import { roleKeys } from "./query-keys";

export function useAssignRolePermissions(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissionIds: string[]) => rolesApi.assignPermissions(roleId, permissionIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}
