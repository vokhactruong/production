import type { ClassSessionStatus } from "../../types";

export const CLASS_SESSION_STATUS_CONFIG: Record<
  ClassSessionStatus,
  { label: string; cls: string; dot: string }
> = {
  PLANNED: {
    label: "Đã lên kế hoạch",
    cls: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  ONGOING: {
    label: "Đang diễn ra",
    cls: "bg-green-100 text-green-700",
    dot: "bg-green-500",
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

// Mirrors the backend's ALLOWED_TRANSITIONS in class-sessions.service.ts — used
// to restrict the Edit form's status options to valid transitions only, so the
// user never picks a value the API would reject.
export const CLASS_SESSION_ALLOWED_TRANSITIONS: Record<ClassSessionStatus, ClassSessionStatus[]> = {
  PLANNED: ["ONGOING", "CANCELLED"],
  ONGOING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
