import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "../api/employees.api";
import { getData } from "../../../lib/api-client";
import { employeeKeys } from "./query-keys";
import type { Employee } from "../../../types";

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => employeesApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<Employee>(employeeKeys.detail(id), getData(response));
    },
  });
}
