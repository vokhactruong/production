import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../api/employees.api";
import { getList } from "../../../lib/api-client";
import { employeeKeys } from "./query-keys";
import type { Employee } from "../../../types";

interface EmployeeFilters {
  search?: string;
  employeeType?: string;
  status?: string;
  page?: number;
}

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () =>
      employeesApi
        .getAll({
          search: filters.search || undefined,
          employeeType: filters.employeeType || undefined,
          status: filters.status || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Employee>(res)),
  });
}
