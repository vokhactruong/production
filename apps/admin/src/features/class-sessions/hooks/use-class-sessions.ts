import { useQuery } from "@tanstack/react-query";
import { classSessionsApi } from "../api/class-sessions.api";
import { getList } from "../../../lib/api-client";
import { classSessionKeys } from "./query-keys";
import type { ClassSession } from "../../../types";

interface ClassSessionFilters {
  search?: string;
  classId?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export function useClassSessions(filters: ClassSessionFilters) {
  return useQuery({
    queryKey: classSessionKeys.list(filters),
    queryFn: () =>
      classSessionsApi
        .getAll({
          search: filters.search || undefined,
          classId: filters.classId || undefined,
          status: filters.status || undefined,
          date: filters.date || undefined,
          page: filters.page,
          limit: filters.limit ?? 10,
        })
        .then((res) => getList<ClassSession>(res)),
  });
}
