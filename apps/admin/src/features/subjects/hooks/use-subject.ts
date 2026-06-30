import { useQuery } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects.api";
import { getData } from "../../../lib/api-client";
import { subjectKeys } from "./query-keys";
import type { Subject } from "../../../types";

export function useSubject(id: string | undefined) {
  return useQuery({
    queryKey: subjectKeys.detail(id ?? ""),
    queryFn: () => subjectsApi.getOne(id!).then((res) => getData<Subject>(res)),
    enabled: Boolean(id),
  });
}
