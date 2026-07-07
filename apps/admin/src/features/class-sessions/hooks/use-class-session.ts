import { useQuery } from "@tanstack/react-query";
import { classSessionsApi } from "../api/class-sessions.api";
import { getData } from "../../../lib/api-client";
import { classSessionKeys } from "./query-keys";
import type { ClassSession } from "../../../types";

export function useClassSession(id: string | undefined) {
  return useQuery({
    queryKey: classSessionKeys.detail(id ?? ""),
    queryFn: () => classSessionsApi.getOne(id!).then((res) => getData<ClassSession>(res)),
    enabled: Boolean(id),
  });
}
