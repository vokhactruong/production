import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "../api/employees.api";
import { getData } from "../../../lib/api-client";
import { employeeKeys } from "./query-keys";
import type { Employee } from "../../../types";

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => employeesApi.create(data),
    onSuccess: (response) => {
      const created = getData<Employee>(response);
      qc.setQueryData<Employee>(employeeKeys.detail(created.id), created);
    },
  });
}
