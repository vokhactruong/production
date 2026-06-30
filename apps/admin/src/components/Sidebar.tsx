import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  Key,
  Tag,
  FileText,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
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
  { href: "/roles", icon: Shield, label: "Vai trò", permission: PERMISSIONS.ROLE_READ },
  { href: "/permissions", icon: Key, label: "Quyền hạn", permission: PERMISSIONS.PERMISSION_READ },
  { href: "/categories", icon: Tag, label: "Danh mục", permission: PERMISSIONS.CATEGORY_READ },
  { href: "/articles", icon: FileText, label: "Bài viết", permission: PERMISSIONS.ARTICLE_READ },
  { href: "/profile", icon: User, label: "Hồ sơ", permission: null },
  { href: "/settings", icon: Settings, label: "Cài đặt", permission: null },
];

export default function Sidebar() {
  const { hasPermission, user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const handleLogout = () => authManager.logout();

  const visibleMenu = MENU.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
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
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-slate-900">School Portal</p>
            <p className="truncate text-xs text-slate-500">Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {visibleMenu.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
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
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-2">
        {!sidebarCollapsed && user && (
          <div className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2">
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
            sidebarCollapsed && "justify-center"
          )}
          title={sidebarCollapsed ? "Đăng xuất" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Đăng xuất</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="mt-1 flex w-full items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
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
