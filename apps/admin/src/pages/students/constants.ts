import type { StudentStatus } from "../../types";

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: { search?: string; status?: string; page?: number }) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

export const auditLogKeys = {
  forEntity: (entity: string, entityId: string, limit: number) =>
    ["audit-logs", entity, entityId, limit] as const,
};

export const STATUS_CONFIG: Record<StudentStatus, { label: string; cls: string; dot: string }> = {
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
  SUSPENDED: {
    label: "Bị khoá",
    cls: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

export const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};
