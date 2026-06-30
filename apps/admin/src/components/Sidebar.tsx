import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  BookMarked,
  Shield,
  Key,
  Tag,
  FileText,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore, useUIStore } from "../store/auth.store";
import { cn } from "../utils";
import { authManager } from "../features/auth/services/auth-manager";
import { PERMISSIONS } from "../constants/permissions";

const MENU = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  { href: "/users", icon: Users, label: "Người dùng", permission: PERMISSIONS.USER_READ },
  {
    href: "/students",
    icon: GraduationCap,
    label: "Học sinh",
    permission: PERMISSIONS.STUDENT_READ,
  },
  {
    href: "/subjects",
    icon: BookOpen,
    label: "Môn học",
    permission: PERMISSIONS.SUBJECT_READ,
  },
  {
    href: "/courses",
    icon: BookMarked,
    label: "Khóa học",
    permission: PERMISSIONS.COURSE_READ,
  },
  { href: "/roles", icon: Shield, label: "Vai trò", permission: PERMISSIONS.ROLE_READ },
  { href: "/permissions", icon: Key, label: "Quyền hạn", permission: PERMISSIONS.PERMISSION_READ },
  { href: "/categories", icon: Tag, label: "Danh mục", permission: PERMISSIONS.CATEGORY_READ },
  { href: "/articles", icon: FileText, label: "Bài viết", permission: PERMISSIONS.ARTICLE_READ },
  { href: "/profile", icon: User, label: "Hồ sơ", permission: null },
  { href: "/settings", icon: Settings, label: "Cài đặt", permission: null },
];

export default function Sidebar() {
  const { hasPermission, user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, closeSidebar } = useUIStore();
  const handleLogout = () => authManager.logout();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) closeSidebar();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, closeSidebar]);

  const visibleMenu = MENU.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300",
        // Mobile/tablet: fixed overlay drawer
        "fixed inset-y-0 left-0 z-50",
        sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        // Desktop: static in-flow, always visible
        "lg:static lg:inset-auto lg:translate-x-0 lg:shadow-none lg:z-auto",
        // Width: mobile always w-64, desktop respects collapsed state
        "w-64",
        sidebarCollapsed && "lg:w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        {/* Title — always shown on mobile, hidden on desktop when collapsed */}
        <div className={cn("flex-1 overflow-hidden", sidebarCollapsed && "lg:hidden")}>
          <p className="truncate text-sm font-bold text-slate-900">School Portal</p>
          <p className="truncate text-xs text-slate-500">Admin</p>
        </div>

        {/* Close button — mobile/tablet only */}
        <button
          onClick={closeSidebar}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {visibleMenu.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={closeSidebar}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors mb-1",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {/* Label: always show on mobile, hide on desktop when collapsed */}
            <span className={cn("truncate", sidebarCollapsed && "lg:hidden")}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-2">
        {/* User info: always show on mobile, hide on desktop when collapsed */}
        {user && (
          <div
            className={cn(
              "mb-2 flex items-center gap-2 rounded-xl px-3 py-2",
              sidebarCollapsed && "lg:hidden"
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-xs font-semibold text-white">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-medium text-slate-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors",
            sidebarCollapsed && "lg:justify-center"
          )}
          title={sidebarCollapsed ? "Đăng xuất" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(sidebarCollapsed && "lg:hidden")}>Đăng xuất</span>
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="mt-1 hidden lg:flex w-full items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
