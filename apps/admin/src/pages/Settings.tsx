import { useUIStore } from "../store/auth.store";
import { Sun, Moon } from "lucide-react";
import { cn } from "../utils";

export default function Settings() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cài đặt</h2>
        <p className="mt-1 text-sm text-slate-500">Tuỳ chỉnh giao diện và hệ thống</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Giao diện</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-colors",
              theme === "light"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Sun className="h-4 w-4" />
            Sáng
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-colors",
              theme === "dark"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Moon className="h-4 w-4" />
            Tối
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Thông tin hệ thống</h3>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Phiên bản</dt>
            <dd className="font-medium text-slate-900">1.0.0</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Backend</dt>
            <dd className="font-medium text-slate-900">NestJS 10 + Prisma 5</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Frontend</dt>
            <dd className="font-medium text-slate-900">React 19 + Vite</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Database</dt>
            <dd className="font-medium text-slate-900">PostgreSQL 16</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Architecture</dt>
            <dd className="font-medium text-slate-900">TurboRepo Monorepo</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
