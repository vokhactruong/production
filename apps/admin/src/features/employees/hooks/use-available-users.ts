import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../api/employees.api";
import { getData } from "../../../lib/api-client";
import { employeeKeys } from "./query-keys";

export interface AvailableUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function useAvailableUsers() {
  return useQuery({
    queryKey: employeeKeys.availableUsers(),
    queryFn: () => employeesApi.availableUsers().then((res) => getData<AvailableUser[]>(res)),
  });
}
