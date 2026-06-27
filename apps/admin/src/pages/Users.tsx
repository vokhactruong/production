import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { usersApi, rolesApi, getData, getList } from "../api/client";
import { useToast } from "../components/Toast";
import Can from "../components/Can";
import { useAuthStore } from "../store/auth.store";
import { PERMISSIONS } from "../constants/permissions";
import { cn, formatDate, getInitials } from "../utils";
import { useDebounce } from "../hooks";
import type { User, Role } from "../types";
import axios from "axios";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

const STATUS_BADGE: Record<UserStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  SUSPENDED: "Bị khoá",
};

interface UserModalProps {
  mode: "create" | "edit";
  user?: User & { roles?: Role[] };
  roles: Role[];
  onClose: () => void;
}

function UserModal({ mode, user, roles, onClose }: UserModalProps) {
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    password: "",
    status: (user?.status ?? "ACTIVE") as UserStatus,
    roleIds: user?.roles?.map((r) => r.id) ?? [],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload =
        mode === "create"
          ? {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              password: form.password,
              status: form.status,
              roleIds: form.roleIds,
            }
          : {
              firstName: form.firstName,
              lastName: form.lastName,
              status: form.status,
              roleIds: form.roleIds,
            };
      if (mode === "create") return usersApi.create(payload);
      return usersApi.update(user!.id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      emitToast(mode === "create" ? "Tạo người dùng thành công" : "Cập nhật thành công", "success");
      onClose();
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
        : "Có lỗi";
      emitToast(msg, "error");
    },
  });

  const toggleRole = (id: string) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(id)
        ? prev.roleIds.filter((r) => r !== id)
        : [...prev.roleIds, id],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Tạo người dùng" : "Sửa người dùng"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="overflow-y-auto max-h-[70vh] p-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Họ</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tên</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {mode === "create" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as UserStatus }))}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="SUSPENDED">Bị khoá</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Vai trò</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                    form.roleIds.includes(r.id)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? "Đang lưu..." : mode === "create" ? "Tạo" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const qc = useQueryClient();
  const { emitToast } = useToast();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{
    mode: "create" | "edit";
    user?: User & { roles?: Role[] };
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch, status, page],
    queryFn: () =>
      usersApi.getAll({
        search: debouncedSearch || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll(),
    enabled: hasPermission(PERMISSIONS.ROLE_READ),
  });

  const usersData = data ? getList<User & { roles?: Role[] }>(data) : null;
  const roles = rolesData ? getData<Role[]>(rolesData) : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      emitToast("Đã xóa người dùng", "success");
      setDeleteId(null);
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
        : "Có lỗi";
      emitToast(msg, "error");
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Người dùng</h2>
          <p className="mt-1 text-sm text-slate-500">{usersData?.meta.total ?? 0} người dùng</p>
        </div>
        <Can permission="user.create">
          <button
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Tạo mới
          </button>
        </Can>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm..."
            className="h-10 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="SUSPENDED">Bị khoá</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Người dùng
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Đang tải...
                </td>
              </tr>
            ) : usersData?.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              usersData?.items.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-xs font-semibold text-white">
                        {u.avatar ? (
                          <img src={u.avatar} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          getInitials(u.firstName, u.lastName)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((r) => (
                        <span
                          key={r.id}
                          className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-lg px-2.5 py-0.5 text-xs font-medium",
                        STATUS_BADGE[u.status as UserStatus]
                      )}
                    >
                      {STATUS_LABEL[u.status as UserStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Can permission="user.update">
                        <button
                          onClick={() => setModal({ mode: "edit", user: u })}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Can>
                      <Can permission="user.delete">
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {usersData && usersData.meta.totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: usersData.meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-sm",
                page === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          roles={roles}
          onClose={() => setModal(null)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa</h3>
            <p className="mt-2 text-sm text-slate-500">
              Bạn có chắc muốn xóa người dùng này? Hành động không thể hoàn tác.
            </p>
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
