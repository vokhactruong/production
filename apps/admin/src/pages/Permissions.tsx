import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "../features/permissions/api/permissions.api";
import { getData } from "../lib/api-client";
import { useAuthStore } from "../store/auth.store";
import { PERMISSIONS } from "../constants/permissions";
import type { Permission } from "../types";

const MODULE_GROUPS: Record<string, { label: string; color: string }> = {
  dashboard: { label: "Dashboard", color: "bg-blue-100 text-blue-700" },
  user: { label: "Người dùng", color: "bg-indigo-100 text-indigo-700" },
  role: { label: "Vai trò", color: "bg-purple-100 text-purple-700" },
  permission: { label: "Quyền hạn", color: "bg-violet-100 text-violet-700" },
  article: { label: "Bài viết", color: "bg-orange-100 text-orange-700" },
  category: { label: "Danh mục", color: "bg-green-100 text-green-700" },
  upload: { label: "Upload", color: "bg-teal-100 text-teal-700" },
  profile: { label: "Hồ sơ", color: "bg-pink-100 text-pink-700" },
};

function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const perm of permissions) {
    const module = perm.code.split(".")[0];
    if (!groups[module]) groups[module] = [];
    groups[module].push(perm);
  }
  return groups;
}

export default function Permissions() {
  const { hasPermission } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.getAll(),
    enabled: hasPermission(PERMISSIONS.PERMISSION_READ),
  });

  const permissions = data ? getData<Permission[]>(data) : [];
  const groups = groupPermissions(permissions);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Quyền hạn hệ thống</h2>
        <p className="mt-1 text-sm text-slate-500">
          Permissions được seed sẵn, không thể thêm/sửa/xóa.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(groups).map(([module, perms]) => {
          const meta = MODULE_GROUPS[module] ?? {
            label: module,
            color: "bg-slate-100 text-slate-700",
          };
          return (
            <div key={module} className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-xs text-slate-400">{perms.length} quyền</span>
              </div>
              <ul className="flex flex-col gap-2">
                {perms.map((perm) => (
                  <li key={perm.id} className="flex flex-col gap-0.5">
                    <code className="text-xs font-mono text-slate-600 bg-slate-50 rounded px-1.5 py-0.5 w-fit">
                      {perm.code}
                    </code>
                    <span className="text-xs text-slate-500">{perm.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
