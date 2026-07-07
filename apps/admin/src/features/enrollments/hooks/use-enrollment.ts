import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "../api/enrollments.api";
import { getData } from "../../../lib/api-client";
import { enrollmentKeys } from "./query-keys";
import type { Enrollment } from "../../../types";

export function useEnrollment(id: string | undefined) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id ?? ""),
    queryFn: () => enrollmentsApi.getOne(id!).then((res) => getData<Enrollment>(res)),
    enabled: Boolean(id),
  });
}
