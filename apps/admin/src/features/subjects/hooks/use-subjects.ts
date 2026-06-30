import { useQuery } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects.api";
import { getList } from "../../../lib/api-client";
import { subjectKeys } from "./query-keys";
import type { Subject } from "../../../types";

interface SubjectFilters {
  search?: string;
  status?: string;
  page?: number;
}

export function useSubjects(filters: SubjectFilters) {
  return useQuery({
    queryKey: subjectKeys.list(filters),
    queryFn: () =>
      subjectsApi
        .getAll({
          search: filters.search || undefined,
          status: filters.status || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Subject>(res)),
  });
}
