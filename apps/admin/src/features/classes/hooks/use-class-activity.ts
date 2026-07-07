import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { auditLogsApi } from "../../audit-logs/api/audit-logs.api";
import { getList } from "../../../lib/api-client";
import { classKeys } from "./query-keys";
import type { AuditLog } from "../../../types";

export function useClassActivity(classId: string, limit: number) {
  return useQuery({
    queryKey: [...classKeys.activity(classId), limit],
    queryFn: () =>
      auditLogsApi.getForEntity("Class", classId, { limit }).then((res) => getList<AuditLog>(res)),
    placeholderData: keepPreviousData,
  });
}
