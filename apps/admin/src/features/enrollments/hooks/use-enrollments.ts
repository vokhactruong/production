import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "../api/enrollments.api";
import { getList } from "../../../lib/api-client";
import { enrollmentKeys } from "./query-keys";
import type { Enrollment } from "../../../types";

interface EnrollmentFilters {
  search?: string;
  studentId?: string;
  classId?: string;
  status?: string;
  page?: number;
}

export function useEnrollments(filters: EnrollmentFilters) {
  return useQuery({
    queryKey: enrollmentKeys.list(filters),
    queryFn: () =>
      enrollmentsApi
        .getAll({
          search: filters.search || undefined,
          studentId: filters.studentId || undefined,
          classId: filters.classId || undefined,
          status: filters.status || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Enrollment>(res)),
  });
}
