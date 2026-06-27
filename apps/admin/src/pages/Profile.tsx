import React, { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { usersApi, uploadApi, getData } from "../api/client";
import { useToast } from "../components/Toast";
import type { User } from "../types";
import axios from "axios";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function Profile() {
  const { user, setAuth, accessToken } = useAuthStore();
  const { emitToast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const pendingPublicIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (pendingPublicIdRef.current) {
        uploadApi.deleteImage(pendingPublicIdRef.current).catch(() => {});
      }
    };
  }, []);

  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIMES.includes(file.type)) {
      emitToast("Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF", "error");
      return;
    }
    if (file.size > MAX_SIZE) {
      emitToast("Ảnh không được vượt quá 5MB", "error");
      return;
    }

    if (pendingPublicIdRef.current) {
      await uploadApi.deleteImage(pendingPublicIdRef.current).catch(() => {});
      pendingPublicIdRef.current = null;
    }

    setIsUploading(true);
    try {
      const res = await uploadApi.image(file);
      const { url, publicId } = getData<{ url: string; publicId: string }>(res);
      setAvatar(url);
      pendingPublicIdRef.current = publicId;
    } catch {
      emitToast("Lỗi khi tải ảnh lên", "error");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (pendingPublicIdRef.current) {
      await uploadApi.deleteImage(pendingPublicIdRef.current).catch(() => {});
      pendingPublicIdRef.current = null;
    }
    setAvatar("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await usersApi.update(user.id, {
        firstName,
        lastName,
        avatar: avatar || null,
      });
      const updated = getData<User>(res);
      pendingPublicIdRef.current = null;
      if (accessToken) {
        setAuth(
          { ...user, firstName: updated.firstName, lastName: updated.lastName, avatar: updated.avatar ?? undefined },
          accessToken,
        );
      }
      emitToast("Cập nhật hồ sơ thành công", "success");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra"
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Hồ sơ</h2>
        <p className="mt-1 text-sm text-slate-500">Thông tin cá nhân</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-8">
        <div className="flex items-center gap-6 mb-8">
          {/* Avatar upload */}
          <div className="relative flex-shrink-0">
            {avatar ? (
              <>
                <img src={avatar} alt={user.firstName} className="h-20 w-20 rounded-full object-cover" />
                {!isUploading && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-2xl font-bold text-white">
                {isUploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  initials
                )}
              </div>
            )}

            {/* Overlay button khi có ảnh */}
            {avatar && isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-50 shadow-sm"
              title="Đổi ảnh đại diện"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleAvatarChange}
              disabled={isUploading}
            />
          </div>

          <div>
            <p className="text-xl font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="mt-0.5 text-xs text-slate-400">JPG, PNG, WebP, GIF · Tối đa 5MB</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <span key={r} className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tên</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || isUploading}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Danh sách quyền hạn</h3>
        <div className="flex flex-wrap gap-1.5">
          {user.permissions.map((p) => (
            <span key={p} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
