import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { DeleteDialog } from "../components/DeleteDialog";
import { permissionsApi } from "../features/permissions/api/permissions.api";
import { rolesApi } from "../features/roles/api/roles.api";
import { roleKeys } from "../features/roles/hooks/query-keys";
import { permissionKeys } from "../features/permissions/hooks/query-keys";
import { useCreateRole } from "../features/roles/hooks/use-create-role";
import { useUpdateRole } from "../features/roles/hooks/use-update-role";
import { useAssignRolePermissions } from "../features/roles/hooks/use-assign-role-permissions";
import { useDeleteRole } from "../features/roles/hooks/use-delete-role";
import { getData } from "../lib/api-client";
import { useAuthStore } from "../store/auth.store";
import { PERMISSIONS } from "../constants/permissions";
import { useToast } from "../components/Toast";
import Can from "../components/Can";
import { cn } from "../utils";
import type { Role, Permission } from "../types";
import axios from "axios";

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  user: "Người dùng",
  role: "Vai trò",
  permission: "Quyền hạn",
  article: "Bài viết",
  category: "Danh mục",
  upload: "Upload",
  profile: "Hồ sơ",
};

function groupPermissions(permissions: Permission[]) {
  const groups: Record<string, Permission[]> = {};
  for (const p of permissions) {
    const mod = p.code.split(".")[0];
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(p);
  }
  return groups;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-3 w-12 rounded bg-slate-200" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-7 w-24 rounded-xl bg-slate-200" />
        <div className="h-7 w-16 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function Roles() {
  const { emitToast } = useToast();
  const { hasPermission } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [assignRole, setAssignRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const {
    data: rolesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => rolesApi.getAll(),
    enabled: hasPermission(PERMISSIONS.ROLE_READ),
  });
  const { data: permsData } = useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: () => permissionsApi.getAll(),
    enabled: hasPermission(PERMISSIONS.PERMISSION_READ),
  });

  const roles = rolesData ? getData<Role[]>(rolesData) : [];
  const allPerms = permsData ? getData<Permission[]>(permsData) : [];
  const groups = groupPermissions(allPerms);

  const openCreate = () => {
    setFormName("");
    setFormDesc("");
    setCreateOpen(true);
  };
  const openEdit = (role: Role) => {
    setFormName(role.name);
    setFormDesc(role.description ?? "");
    setEditRole(role);
  };
  const openAssign = (role: Role) => {
    setSelectedPerms(role.permissions?.map((p) => p.id) ?? []);
    setAssignRole(role);
  };

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(editRole?.id ?? "");
  const assignMutation = useAssignRolePermissions(assignRole?.id ?? "");
  const deleteMutation = useDeleteRole();

  const toastError = (err: unknown) =>
    emitToast(
      axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
        : "Có lỗi",
      "error"
    );

  const togglePerm = (id: string) =>
    setSelectedPerms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  const toggleGroup = (perms: Permission[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPerms.includes(id));
    setSelectedPerms((prev) =>
      allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vai trò</h2>
          <p className="mt-1 text-sm text-slate-500">{roles.length} vai trò</p>
        </div>
        <Can permission={PERMISSIONS.ROLE_CREATE}>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Tạo vai trò
          </button>
        </Can>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Không thể tải dữ liệu</p>
              <p className="mt-0.5 text-xs text-slate-400">Vui lòng thử lại sau</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{role.name}</h3>
                    {role.isSystem && (
                      <span className="rounded-lg bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="mt-1 text-sm text-slate-500">{role.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-slate-500">
                <span>{role._count?.userRoles ?? 0} người dùng</span>
                <span>{role.permissions?.length ?? 0} quyền</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Can permission={PERMISSIONS.PERMISSION_ASSIGN}>
                  <button
                    onClick={() => openAssign(role)}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <ShieldCheck className="h-3 w-3" /> Phân quyền
                  </button>
                </Can>
                <Can permission={PERMISSIONS.ROLE_UPDATE}>
                  <button
                    onClick={() => openEdit(role)}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil className="h-3 w-3" /> Sửa
                  </button>
                </Can>
                {!role.isSystem && (
                  <Can permission={PERMISSIONS.ROLE_DELETE}>
                    <button
                      onClick={() => setDeleteId(role.id)}
                      className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" /> Xóa
                    </button>
                  </Can>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(createOpen || editRole) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={
              !createMutation.isPending && !updateMutation.isPending
                ? () => {
                    setCreateOpen(false);
                    setEditRole(null);
                  }
                : undefined
            }
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold">
                {createOpen ? "Tạo vai trò" : "Sửa vai trò"}
              </h2>
              <button
                onClick={() => {
                  setCreateOpen(false);
                  setEditRole(null);
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = { name: formName, description: formDesc || undefined };
                if (createOpen) {
                  createMutation.mutate(data, {
                    onSuccess: () => {
                      emitToast("Tạo vai trò thành công", "success");
                      setCreateOpen(false);
                    },
                    onError: toastError,
                  });
                } else {
                  updateMutation.mutate(data, {
                    onSuccess: () => {
                      emitToast("Cập nhật thành công", "success");
                      setEditRole(null);
                    },
                    onError: toastError,
                  });
                }
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tên vai trò
                  </label>
                  <input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t px-6 py-4 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    setEditRole(null);
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Permissions Modal */}
      {assignRole && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={!assignMutation.isPending ? () => setAssignRole(null) : undefined}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold">Phân quyền — {assignRole.name}</h2>
              <button
                onClick={() => setAssignRole(null)}
                disabled={assignMutation.isPending}
                className="rounded-lg p-1 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-4">
              {Object.entries(groups).map(([mod, perms]) => {
                const allSelected = perms.every((p) => selectedPerms.includes(p.id));
                return (
                  <div key={mod}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-700">
                        {MODULE_LABELS[mod] ?? mod}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleGroup(perms)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePerm(p.id)}
                          className={cn(
                            "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
                            selectedPerms.includes(p.id)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-300 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {p.code}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4 shrink-0">
              <button
                onClick={() => setAssignRole(null)}
                disabled={assignMutation.isPending}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={() =>
                  assignMutation.mutate(selectedPerms, {
                    onSuccess: () => {
                      emitToast("Gán quyền thành công", "success");
                      setAssignRole(null);
                    },
                    onError: toastError,
                  })
                }
                disabled={assignMutation.isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {assignMutation.isPending ? "Đang lưu..." : "Lưu quyền"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        title="Xác nhận xóa vai trò?"
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(deleteId!, {
            onSuccess: () => {
              emitToast("Đã xóa vai trò", "success");
              setDeleteId(null);
            },
            onError: toastError,
          })
        }
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
