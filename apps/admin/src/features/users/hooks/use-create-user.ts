import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users.api";
import { getData } from "../../../lib/api-client";
import { userKeys } from "./query-keys";
import { dashboardKeys } from "../../dashboard/hooks/query-keys";
import type { User } from "../../../types";

interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status: string;
  roleIds: string[];
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => usersApi.create(data),
    onSuccess: (response) => {
      const user = getData<User>(response);
      qc.setQueryData(userKeys.detail(user.id), user);
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
