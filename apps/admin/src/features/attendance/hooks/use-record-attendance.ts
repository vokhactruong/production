import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../api/attendance.api";
import { attendanceKeys } from "./query-keys";
import { enrollmentKeys } from "../../enrollments/hooks/query-keys";

// Bulk roster recording (single POST — idempotent upsert on the server).
// Cross-module invalidation is intentional: enrollment `consumed`/`remaining`
// are DERIVED from attendance evidence (Derived Balance is Source of Truth),
// so every attendance write must invalidate enrollment reads (CACHE.md /
// QUERY_KEYS.md: a mutation may touch another module's keys when it affects
// that module's data).
export function useRecordAttendance(classSessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => attendanceApi.recordSession(classSessionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.session(classSessionId) });
      qc.invalidateQueries({ queryKey: attendanceKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.details() });
    },
  });
}
