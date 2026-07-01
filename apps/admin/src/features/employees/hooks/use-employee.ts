import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../api/employees.api";
import { getData } from "../../../lib/api-client";
import { employeeKeys } from "./query-keys";
import type { Employee } from "../../../types";

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? ""),
    queryFn: () => employeesApi.getOne(id!).then((res) => getData<Employee>(res)),
    enabled: Boolean(id),
  });
}
