import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "../api/attendance.api";
import { getList } from "../../../lib/api-client";
import { attendanceKeys } from "./query-keys";
import type { Attendance } from "../../../types";

interface AttendanceFilters {
  classSessionId?: string;
  classId?: string;
  studentId?: string;
  status?: string;
  page?: number;
}

export function useAttendanceList(filters: AttendanceFilters) {
  return useQuery({
    queryKey: attendanceKeys.list(filters),
    queryFn: () =>
      attendanceApi
        .getAll({
          classSessionId: filters.classSessionId || undefined,
          classId: filters.classId || undefined,
          studentId: filters.studentId || undefined,
          status: filters.status || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<Attendance>(res)),
  });
}
