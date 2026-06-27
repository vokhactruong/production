import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi, getData } from "../api/client";
import { useAuthStore } from "../store/auth.store";
import { useToast } from "../components/Toast";
import type { AuthUser } from "../types";
import axios from "axios";

const schema = z.object({
  firstName: z.string().min(1, "Không để trống"),
  lastName: z.string().min(1, "Không để trống"),
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Tối thiểu 8 ký tự")
    .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Cần ít nhất 1 số")
    .regex(/[^A-Za-z0-9]/, "Cần ít nhất 1 ký tự đặc biệt"),
});
type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { emitToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      const result = getData<{ accessToken: string; user: AuthUser }>(res);
      setAuth(result.user, result.accessToken);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data
          ? ((err.response.data as { message?: string }).message ?? "Đăng ký thất bại")
          : "Đăng ký thất bại";
      emitToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo tài khoản mới</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ</label>
                <input
                  {...register("firstName")}
                  placeholder="Nguyễn"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tên</label>
                <input
                  {...register("lastName")}
                  placeholder="Văn A"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                {...register("email")}
                placeholder="email@example.com"
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                type="password"
                {...register("password")}
                placeholder="Min8!Aa1"
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
