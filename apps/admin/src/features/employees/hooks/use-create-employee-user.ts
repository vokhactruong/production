import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "../api/employees.api";
import { getData } from "../../../lib/api-client";
import { employeeKeys } from "./query-keys";
import type { Employee } from "../../../types";

export function useCreateEmployeeUser(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string; roleId: string }) =>
      employeesApi.createUser(employeeId, data),
    onSuccess: (response) => {
      qc.setQueryData<Employee>(employeeKeys.detail(employeeId), getData<Employee>(response));
    },
  });
}
