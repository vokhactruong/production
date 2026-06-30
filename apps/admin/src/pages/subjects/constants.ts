import type { SubjectStatus } from "../../types";

export const SUBJECT_STATUS_CONFIG: Record<
  SubjectStatus,
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
