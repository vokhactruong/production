import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { auditLogsApi } from "../../audit-logs/api/audit-logs.api";
import { getList } from "../../../lib/api-client";
import { classroomKeys } from "./query-keys";
import type { AuditLog } from "../../../types";

export function useClassroomActivity(classroomId: string, limit: number) {
  return useQuery({
    queryKey: [...classroomKeys.activity(classroomId), limit],
    queryFn: () =>
      auditLogsApi
        .getForEntity("Classroom", classroomId, { limit })
        .then((res) => getList<AuditLog>(res)),
    placeholderData: keepPreviousData,
  });
}
