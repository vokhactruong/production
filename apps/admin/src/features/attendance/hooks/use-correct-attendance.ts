import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../api/attendance.api";
import { getData } from "../../../lib/api-client";
import { attendanceKeys } from "./query-keys";
import { enrollmentKeys } from "../../enrollments/hooks/query-keys";
import type { Attendance } from "../../../types";

// Correction of one evidence row (status/note only — never a delete). The
// 48h window / `attendance.correct` rule is enforced by the API; this hook
// only propagates errors. Enrollment keys are invalidated because a
// correction to/from a non-deducting status changes the derived balance.
export function useCorrectAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => attendanceApi.correct(id, data),
    onSuccess: (response, { id }) => {
      qc.setQueryData<Attendance>(attendanceKeys.detail(id), getData<Attendance>(response));
      qc.invalidateQueries({ queryKey: attendanceKeys.sessions() });
      qc.invalidateQueries({ queryKey: attendanceKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.details() });
    },
  });
}
