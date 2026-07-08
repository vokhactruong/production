import type { AttendanceStatus } from "../../types";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];

// `activeCls` styles the selected option of the segmented status control on
// the session recording screen; `cls`/`dot` follow the badge pattern of the
// other *_STATUS_CONFIG maps.
export const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; cls: string; dot: string; activeCls: string }
> = {
  PRESENT: {
    label: "Có mặt",
    cls: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    activeCls: "bg-green-600 text-white shadow-sm",
  },
  LATE: {
    label: "Đi trễ",
    cls: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    activeCls: "bg-amber-500 text-white shadow-sm",
  },
  ABSENT: {
    label: "Vắng mặt",
    cls: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    activeCls: "bg-red-600 text-white shadow-sm",
  },
  EXCUSED: {
    label: "Có phép",
    cls: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    activeCls: "bg-blue-600 text-white shadow-sm",
  },
};

/**
 * 48h correction-window deadline (approved D3), anchored to the session's END
 * datetime — mirrors the backend's sessionEndDateTime (UTC composition of
 * session.date + endTime). UI hint only: the backend stays authoritative.
 */
export function isPastCorrectionWindow(session: { date: string; endTime: string }): boolean {
  const end = new Date(`${session.date.slice(0, 10)}T${session.endTime.slice(11, 19)}Z`);
  return Date.now() > end.getTime() + 48 * 60 * 60 * 1000;
}
