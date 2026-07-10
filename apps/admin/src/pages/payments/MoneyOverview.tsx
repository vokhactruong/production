import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  TrendingUp,
  Landmark,
  Coins,
  AlertCircle,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { useMoneySummary } from "../../features/payments/hooks/use-money-summary";
import { useCredits } from "../../features/payments/hooks/use-credits";
import { useRefundCredit } from "../../features/payments/hooks/use-refund-credit";
import Can from "../../components/Can";
import { useToast } from "../../components/Toast";
import { PERMISSIONS } from "../../constants/permissions";
import { cn, formatCurrency, formatDate } from "../../utils";
import type { LedgerEntry } from "../../features/payments/types";

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err)
    ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
    : "Có lỗi xảy ra";
}

const CREDIT_SOURCE_LABEL: Record<string, string> = {
  OVERPAYMENT: "Tiền thừa",
  WITHDRAWAL: "Rút gói",
};

// ─── Summary cards — revenue & liability are STRICTLY separate (BI-10) ──────────

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: number | undefined;
  hint: string;
  icon: typeof TrendingUp;
  tone: "revenue" | "outstanding" | "credit";
  loading: boolean;
}) {
  const toneCls = {
    revenue: "from-green-500 to-emerald-600",
    outstanding: "from-amber-500 to-orange-600",
    credit: "from-indigo-500 to-violet-600",
  }[tone];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white",
            toneCls
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(value ?? 0)}</p>
      )}
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  );
}

// ─── Credit row ─────────────────────────────────────────────────────────────────

function CreditRow({
  credit,
  onRefund,
}: {
  credit: LedgerEntry;
  onRefund: (c: LedgerEntry) => void;
}) {
  const name = credit.student
    ? `${credit.student.firstName} ${credit.student.lastName}`
    : credit.studentId;
  const refunded = credit.refundStatus === "REFUNDED";
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3.5">
        <p className="font-medium text-slate-900">{name}</p>
        <span className="font-mono text-xs text-slate-400">{credit.student?.code ?? "—"}</span>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600">
        {CREDIT_SOURCE_LABEL[credit.creditSource ?? ""] ?? "—"}
      </td>
      <td className="px-4 py-3.5 font-semibold text-indigo-600">{formatCurrency(credit.amount)}</td>
      <td className="hidden px-4 py-3.5 text-sm text-slate-500 md:table-cell">
        {formatDate(credit.createdAt)}
      </td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
            refunded ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", refunded ? "bg-slate-400" : "bg-green-500")}
          />
          {refunded ? "Đã hoàn" : "Còn hiệu lực"}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        {!refunded && (
          <Can permission={PERMISSIONS.CREDIT_REFUND}>
            <button
              onClick={() => onRefund(credit)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Hoàn credit
            </button>
          </Can>
        )}
      </td>
    </tr>
  );
}

// ─── Refund confirm modal ───────────────────────────────────────────────────────

function RefundDialog({
  credit,
  isPending,
  onConfirm,
  onClose,
}: {
  credit: LedgerEntry | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!credit) return null;
  const name = credit.student
    ? `${credit.student.firstName} ${credit.student.lastName}`
    : credit.studentId;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isPending ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 rounded-t-2xl bg-amber-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Undo2 className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Hoàn credit</h3>
            <p className="text-xs text-slate-500">Số dư credit sẽ giảm tương ứng</p>
          </div>
        </div>
        <div className="px-5 py-4 text-sm text-slate-600">
          Hoàn {formatCurrency(credit.amount)} credit của{" "}
          <span className="font-semibold text-slate-900">{name}</span>? Khoản credit được đánh dấu
          đã hoàn — lịch sử không bị xoá (ghi sổ chỉ thêm, không sửa).
        </div>
        <div className="flex gap-2.5 px-5 pb-5 pt-1">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Đang hoàn..." : "Xác nhận hoàn"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function MoneyOverview() {
  const { emitToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [refundTarget, setRefundTarget] = useState<LedgerEntry | null>(null);

  const { data: summary, isLoading: isSummaryLoading } = useMoneySummary();
  const {
    data: creditsData,
    isLoading: isCreditsLoading,
    isError: isCreditsError,
  } = useCredits({
    page,
  });
  const refundMutation = useRefundCredit();

  const handleRefund = () => {
    if (!refundTarget) return;
    refundMutation.mutate(
      { id: refundTarget.id },
      {
        onSuccess: () => {
          emitToast("Đã hoàn credit", "success");
          setRefundTarget(null);
        },
        onError: (err) => emitToast(extractErrorMessage(err), "error"),
      }
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Doanh thu &amp; Credit</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Các con số thời gian thực, dẫn xuất từ sổ cái — không phải bộ đếm lưu sẵn
        </p>
      </div>

      {/* ── Summary — separate figures (BI-10) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Doanh thu đã thu"
          value={summary?.revenue}
          hint="Σ các khoản thanh toán — không gộp credit"
          icon={TrendingUp}
          tone="revenue"
          loading={isSummaryLoading}
        />
        <SummaryCard
          label="Công nợ phải thu"
          value={summary?.outstanding}
          hint="Tiền học sinh còn nợ trên các chu kỳ đang hiệu lực"
          icon={Landmark}
          tone="outstanding"
          loading={isSummaryLoading}
        />
        <SummaryCard
          label="Credit phải trả"
          value={summary?.creditLiability}
          hint="Số dư credit của học sinh — nghĩa vụ, không phải doanh thu"
          icon={Coins}
          tone="credit"
          loading={isSummaryLoading}
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <span className="font-semibold">Doanh thu</span> và{" "}
          <span className="font-semibold">công nợ / credit</span> là các con số tách biệt — credit
          không bao giờ được tính là doanh thu (BI-10).
        </p>
      </div>

      {/* ── Credit list + refund ───────────────────────────────────────────────── */}
      <Can
        permission={PERMISSIONS.CREDIT_READ}
        fallback={
          <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
            Bạn không có quyền xem credit.
          </p>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-semibold text-slate-800">Khoản credit</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Học sinh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nguồn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Giá trị
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isCreditsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : isCreditsError ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                        <p className="text-sm">Không thể tải danh sách credit</p>
                      </div>
                    </td>
                  </tr>
                ) : creditsData?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Coins className="h-7 w-7 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">
                          Chưa có khoản credit nào
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  creditsData?.items.map((c) => (
                    <CreditRow key={c.id} credit={c} onRefund={setRefundTarget} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {creditsData && creditsData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">
                Trang {creditsData.meta.page} / {creditsData.meta.totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      if (page - 1 > 1) next.set("page", String(page - 1));
                      else next.delete("page");
                      return next;
                    })
                  }
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("page", String(page + 1));
                      return next;
                    })
                  }
                  disabled={page >= creditsData.meta.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Can>

      <RefundDialog
        credit={refundTarget}
        isPending={refundMutation.isPending}
        onConfirm={handleRefund}
        onClose={() => setRefundTarget(null)}
      />
    </div>
  );
}
