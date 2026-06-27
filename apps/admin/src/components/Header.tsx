import React from "react";
import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuthStore } from "../store/auth.store";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Người dùng",
  "/roles": "Vai trò",
  "/permissions": "Quyền hạn",
  "/categories": "Danh mục",
  "/articles": "Bài viết",
  "/articles/new": "Tạo bài viết",
  "/profile": "Hồ sơ",
  "/settings": "Cài đặt",
};

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const title =
    PAGE_TITLES[pathname] ??
    (pathname.includes("/articles/") && pathname.includes("/edit") ? "Chỉnh sửa bài viết" : "School Portal");

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-sm font-semibold text-white">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
