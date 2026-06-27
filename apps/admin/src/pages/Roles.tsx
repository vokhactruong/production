import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { rolesApi, permissionsApi, getData } from "../api/client";
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

export default function Roles() {
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const { hasPermission } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [assignRole, setAssignRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll(),
    enabled: hasPermission(PERMISSIONS.ROLE_READ),
  });
  const { data: permsData } = useQuery({
    queryKey: ["permissions"],
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

  const createMutation = useMutation({
    mutationFn: () => rolesApi.create({ name: formName, description: formDesc }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      emitToast("Tạo vai trò thành công", "success");
      setCreateOpen(false);
    },
    onError: (err) => {
      emitToast(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
          : "Có lỗi",
        "error"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => rolesApi.update(editRole!.id, { name: formName, description: formDesc }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      emitToast("Cập nhật thành công", "success");
      setEditRole(null);
    },
    onError: (err) => {
      emitToast(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
          : "Có lỗi",
        "error"
      );
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => rolesApi.assignPermissions(assignRole!.id, selectedPerms),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      emitToast("Gán quyền thành công", "success");
      setAssignRole(null);
    },
    onError: (err) => {
      emitToast(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
          : "Có lỗi",
        "error"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      emitToast("Đã xóa vai trò", "success");
      setDeleteId(null);
    },
    onError: (err) => {
      emitToast(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
          : "Có lỗi",
        "error"
      );
    },
  });

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
        <Can permission="role.create">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Tạo vai trò
          </button>
        </Can>
      </div>

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
              <Can permission="permission.assign">
                <button
                  onClick={() => openAssign(role)}
                  className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ShieldCheck className="h-3 w-3" /> Phân quyền
                </button>
              </Can>
              <Can permission="role.update">
                <button
                  onClick={() => openEdit(role)}
                  className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-3 w-3" /> Sửa
                </button>
              </Can>
              {!role.isSystem && (
                <Can permission="role.delete">
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

      {/* Create/Edit Modal */}
      {(createOpen || editRole) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setCreateOpen(false);
              setEditRole(null);
            }}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {createOpen ? "Tạo vai trò" : "Sửa vai trò"}
              </h2>
              <button
                onClick={() => {
                  setCreateOpen(false);
                  setEditRole(null);
                }}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOpen ? createMutation.mutate() : updateMutation.mutate();
              }}
              className="p-6 flex flex-col gap-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tên vai trò</label>
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
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    setEditRole(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAssignRole(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Phân quyền — {assignRole.name}</h2>
              <button
                onClick={() => setAssignRole(null)}
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-6 flex flex-col gap-4">
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
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setAssignRole(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {assignMutation.isPending ? "Đang lưu..." : "Lưu quyền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-semibold">Xác nhận xóa vai trò?</h3>
            <p className="mt-2 text-sm text-slate-500">Hành động này không thể hoàn tác.</p>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
