import type { EnrollmentStatus } from "../../types";

export const ENROLLMENT_STATUS_CONFIG: Record<
  EnrollmentStatus,
  { label: string; cls: string; dot: string }
> = {
  PENDING: {
    label: "Chờ bắt đầu",
    cls: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  ACTIVE: {
    label: "Đang học",
    cls: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  PAUSED: {
    label: "Tạm dừng",
    cls: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    cls: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    cls: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};
