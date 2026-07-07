import type { ClassroomType } from "../../types";

export const CLASSROOM_TYPE_CONFIG: Record<
  ClassroomType,
  { label: string; cls: string; dot: string }
> = {
  PHYSICAL: {
    label: "Phòng vật lý",
    cls: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  ONLINE: {
    label: "Phòng trực tuyến",
    cls: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
  LAB: {
    label: "Phòng thí nghiệm",
    cls: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
};

export const CLASSROOM_ACTIVE_CONFIG: Record<
  "true" | "false",
  { label: string; cls: string; dot: string }
> = {
  true: {
    label: "Hoạt động",
    cls: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  false: {
    label: "Không hoạt động",
    cls: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};
