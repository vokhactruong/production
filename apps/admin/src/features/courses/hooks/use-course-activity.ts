import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { auditLogsApi } from "../../audit-logs/api/audit-logs.api";
import { getList } from "../../../lib/api-client";
import { courseKeys } from "./query-keys";
import type { AuditLog } from "../../../types";

export function useCourseActivity(courseId: string, limit: number) {
  return useQuery({
    queryKey: [...courseKeys.activity(courseId), limit],
    queryFn: () =>
      auditLogsApi
        .getForEntity("Course", courseId, { limit })
        .then((res) => getList<AuditLog>(res)),
    placeholderData: keepPreviousData,
  });
}
