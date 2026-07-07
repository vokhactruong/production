import type { ClassStatus } from "../../types";

export const CLASS_STATUS_CONFIG: Record<ClassStatus, { label: string; cls: string; dot: string }> =
  {
    PLANNING: {
      label: "Đang lên kế hoạch",
      cls: "bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    },
    OPEN: {
      label: "Đang mở",
      cls: "bg-green-100 text-green-700",
      dot: "bg-green-500",
    },
    FULL: {
      label: "Đã đầy",
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
