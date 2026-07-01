import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { auditLogsApi } from "../../audit-logs/api/audit-logs.api";
import { getList } from "../../../lib/api-client";
import { auditLogKeys } from "./query-keys";
import type { AuditLog } from "../../../types";

type Options = {
  enabled?: boolean;
};

export function useStudentActivity(studentId: string, limit: number, options?: Options) {
  return useQuery({
    queryKey: auditLogKeys.forEntity("Student", studentId, limit),
    queryFn: () =>
      auditLogsApi
        .getForEntity("Student", studentId, { limit })
        .then((res) => getList<AuditLog>(res)),
    placeholderData: keepPreviousData,
    enabled: Boolean(studentId) && (options?.enabled ?? true),
  });
}
