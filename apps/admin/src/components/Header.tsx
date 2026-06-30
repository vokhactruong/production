import { useLocation } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { useAuthStore, useUIStore } from "../store/auth.store";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Người dùng",
  "/students": "Học sinh",
  "/subjects": "Môn học",
  "/roles": "Vai trò",
  "/permissions": "Quyền hạn",
  "/categories": "Danh mục",
  "/articles": "Bài viết",
  "/articles/new": "Tạo bài viết",
  "/profile": "Hồ sơ",
  "/settings": "Cài đặt",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/students/") && pathname.endsWith("/edit")) return "Chỉnh sửa học sinh";
  if (pathname.startsWith("/students/") && !pathname.endsWith("/edit")) return "Hồ sơ học sinh";
  if (pathname.startsWith("/subjects/") && pathname.endsWith("/edit")) return "Chỉnh sửa môn học";
  if (pathname.startsWith("/subjects/") && !pathname.endsWith("/edit")) return "Chi tiết môn học";
  if (pathname.startsWith("/articles/") && pathname.includes("/edit")) return "Chỉnh sửa bài viết";
  return "School Portal";
}

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { openSidebar } = useUIStore();

  const title = resolveTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile/tablet only */}
        <button
          onClick={openSidebar}
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Bell — hidden on mobile */}
        <button className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        {user && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-sm font-semibold text-white shrink-0">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </div>
        )}
      </div>
    </header>
  );
}
