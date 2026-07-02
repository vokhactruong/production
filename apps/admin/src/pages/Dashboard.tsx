import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Tag, Shield, Key, AlertCircle } from "lucide-react";
import { dashboardApi } from "../features/dashboard/api/dashboard.api";
import { dashboardKeys } from "../features/dashboard/hooks/query-keys";
import { useAuthStore } from "../store/auth.store";
import { PERMISSIONS } from "../constants/permissions";
import { cn, formatDate } from "../utils";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  REVIEW: "bg-yellow-100 text-yellow-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Lưu trữ",
};

function SkeletonStatCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-16 rounded-lg bg-slate-200" />
        </div>
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { hasPermission } = useAuthStore();
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
    enabled: hasPermission(PERMISSIONS.DASHBOARD_ANALYTICS),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Tổng quan hệ thống</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : isError ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">Không thể tải dữ liệu</p>
            <p className="mt-0.5 text-xs text-slate-400">Vui lòng thử lại sau</p>
          </div>
        ) : (
          <>
            {stats?.userCount !== null && stats?.userCount !== undefined && (
              <StatCard
                title="Tổng người dùng"
                value={stats.userCount}
                icon={Users}
                color="bg-blue-500"
              />
            )}
            {stats?.roleCount !== null && stats?.roleCount !== undefined && (
              <StatCard
                title="Vai trò"
                value={stats.roleCount}
                icon={Shield}
                color="bg-indigo-500"
              />
            )}
            {stats?.permCount !== null && stats?.permCount !== undefined && (
              <StatCard
                title="Quyền hạn"
                value={stats.permCount}
                icon={Key}
                color="bg-purple-500"
              />
            )}
            {stats?.catCount !== null && stats?.catCount !== undefined && (
              <StatCard title="Danh mục" value={stats.catCount} icon={Tag} color="bg-green-500" />
            )}
            {stats?.recentArticles !== null && stats?.recentArticles !== undefined && (
              <StatCard
                title="Bài viết gần đây"
                value={stats.recentArticles.length}
                icon={FileText}
                color="bg-orange-500"
              />
            )}
          </>
        )}
      </div>

      {stats?.recentArticles !== null && stats?.recentArticles !== undefined && (
        <div className="rounded-2xl bg-white border border-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Bài viết gần đây</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tác giả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentArticles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  stats.recentArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">{article.title}</td>
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium",
                            STATUS_BADGE[article.status]
                          )}
                        >
                          {STATUS_LABEL[article.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {article.author
                          ? `${article.author.firstName} ${article.author.lastName}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-500">{formatDate(article.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
