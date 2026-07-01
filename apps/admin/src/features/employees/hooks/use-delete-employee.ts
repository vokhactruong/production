import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "../api/employees.api";
import { employeeKeys } from "./query-keys";

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: employeeKeys.detail(id) });
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}
