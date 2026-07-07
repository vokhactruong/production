import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { auditLogsApi } from "../../audit-logs/api/audit-logs.api";
import { getList } from "../../../lib/api-client";
import { enrollmentKeys } from "./query-keys";
import type { AuditLog } from "../../../types";

export function useEnrollmentActivity(enrollmentId: string, limit: number) {
  return useQuery({
    queryKey: [...enrollmentKeys.activity(enrollmentId), limit],
    queryFn: () =>
      auditLogsApi
        .getForEntity("Enrollment", enrollmentId, { limit })
        .then((res) => getList<AuditLog>(res)),
    placeholderData: keepPreviousData,
  });
}
