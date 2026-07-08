import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "../api/attendance.api";
import { getList } from "../../../lib/api-client";
import { attendanceKeys } from "./query-keys";
import type { Attendance } from "../../../types";

// All recorded attendance of ONE session (the recording screen's data source).
// limit 100 = the API's maximum page size; a session roster is bounded by the
// class capacity, which is far below that.
export function useSessionAttendance(classSessionId: string | undefined) {
  return useQuery({
    queryKey: attendanceKeys.session(classSessionId ?? ""),
    queryFn: () =>
      attendanceApi
        .getAll({
          classSessionId,
          sortBy: "createdAt",
          sortOrder: "asc",
          page: 1,
          limit: 100,
        })
        .then((res) => getList<Attendance>(res)),
    enabled: Boolean(classSessionId),
  });
}
