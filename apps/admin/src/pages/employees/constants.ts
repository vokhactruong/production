import type { EmployeeStatus, EmployeeType } from "../../types";

export const EMPLOYEE_STATUS_CONFIG: Record<
  EmployeeStatus,
  { label: string; cls: string; dot: string }
> = {
  ACTIVE: { label: "Đang làm việc", cls: "bg-green-100 text-green-700", dot: "bg-green-500" },
  INACTIVE: { label: "Không hoạt động", cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  ON_LEAVE: { label: "Nghỉ phép", cls: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  RESIGNED: { label: "Đã nghỉ việc", cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

export const EMPLOYEE_TYPE_CONFIG: Record<EmployeeType, { label: string; cls: string }> = {
  TEACHER: { label: "Giáo viên", cls: "bg-blue-100 text-blue-700" },
  RECEPTIONIST: { label: "Lễ tân", cls: "bg-purple-100 text-purple-700" },
  ACCOUNTANT: { label: "Kế toán", cls: "bg-yellow-100 text-yellow-700" },
  ACADEMIC: { label: "Học vụ", cls: "bg-cyan-100 text-cyan-700" },
  MANAGER: { label: "Quản lý", cls: "bg-orange-100 text-orange-700" },
  DIRECTOR: { label: "Giám đốc", cls: "bg-red-100 text-red-700" },
  OTHER: { label: "Khác", cls: "bg-slate-100 text-slate-600" },
};

export const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};
