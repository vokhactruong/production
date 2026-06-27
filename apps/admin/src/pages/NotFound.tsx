import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">Trang không tồn tại</h2>
      <p className="mt-2 text-sm text-slate-500">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <Link to="/dashboard" className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
        Về trang chủ
      </Link>
    </div>
  );
}
