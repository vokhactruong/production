import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users.api";
import { getData } from "../../../lib/api-client";
import { userKeys } from "./query-keys";
import type { User } from "../../../types";

interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  status: string;
  roleIds: string[];
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserPayload) => usersApi.update(id, data),
    onSuccess: (response) => {
      const user = getData<User>(response);
      qc.setQueryData(userKeys.detail(id), user);
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
