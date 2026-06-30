import type { CourseStatus, CourseType } from "../../types";

export const COURSE_STATUS_CONFIG: Record<
  CourseStatus,
  { label: string; cls: string; dot: string }
> = {
  ACTIVE: {
    label: "Hoạt động",
    cls: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  INACTIVE: {
    label: "Không hoạt động",
    cls: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

export const COURSE_TYPE_CONFIG: Record<CourseType, { label: string; cls: string }> = {
  NORMAL: {
    label: "Thường",
    cls: "bg-blue-100 text-blue-700",
  },
  TRIAL: {
    label: "Thử nghiệm",
    cls: "bg-amber-100 text-amber-700",
  },
};
