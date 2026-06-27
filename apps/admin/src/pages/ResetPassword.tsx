import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "../api/client";
import { useToast } from "../components/Toast";
import axios from "axios";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { emitToast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const token = params.get("token") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      emitToast("Token không hợp lệ", "error");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      emitToast("Đặt lại mật khẩu thành công", "success");
      navigate("/login");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
        : "Có lỗi xảy ra";
      emitToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min8!Aa1"
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
