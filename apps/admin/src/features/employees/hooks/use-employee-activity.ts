import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { auditLogsApi } from "../../audit-logs/api/audit-logs.api";
import { getList } from "../../../lib/api-client";
import { auditLogKeys } from "../../students/hooks/query-keys";
import type { AuditLog } from "../../../types";

type Options = {
  enabled?: boolean;
};

export function useEmployeeActivity(employeeId: string, limit: number, options?: Options) {
  return useQuery({
    queryKey: auditLogKeys.forEntity("Employee", employeeId, limit),
    queryFn: () =>
      auditLogsApi
        .getForEntity("Employee", employeeId, { limit })
        .then((res) => getList<AuditLog>(res)),
    placeholderData: keepPreviousData,
    enabled: Boolean(employeeId) && (options?.enabled ?? true),
  });
}
