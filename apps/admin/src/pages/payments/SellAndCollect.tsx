import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Wallet,
  Search,
  AlertCircle,
  Receipt as ReceiptIcon,
  BadgeCheck,
  Printer,
  RotateCcw,
  ArrowRight,
  Coins,
} from "lucide-react";
import { useEnrollments } from "../../features/enrollments/hooks/use-enrollments";
import { useBillingCycles } from "../../features/payments/hooks/use-billing-cycles";
import { useSellPackage } from "../../features/payments/hooks/use-sell-package";
import { useRecordPayment } from "../../features/payments/hooks/use-record-payment";
import Can from "../../components/Can";
import { useToast } from "../../components/Toast";
import { useAuthStore } from "../../store/auth.store";
import { PERMISSIONS } from "../../constants/permissions";
import { cn, formatCurrency } from "../../utils";
import { BILLING_CYCLE_STATUS_CONFIG, PAYMENT_METHODS, PAYMENT_METHOD_CONFIG } from "./constants";
import type {
  BillingCycle,
  PaymentMethod,
  RecordPaymentResult,
} from "../../features/payments/types";
import type { Enrollment } from "../../types";

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err)
    ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi xảy ra")
    : "Có lỗi xảy ra";
}

function studentName(e: Enrollment): string {
  return e.student ? `${e.student.firstName} ${e.student.lastName}` : "—";
}

// A cycle is collectible when it still owes money and is not terminal.
function isCollectible(c: BillingCycle): boolean {
  return (c.status === "PENDING" || c.status === "ACTIVE") && c.outstanding > 0;
}

export default function SellAndCollect() {
  const { emitToast } = useToast();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [searchParams] = useSearchParams();

  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  // The cycle currently being collected (from a just-sold package or the server).
  const [soldCycle, setSoldCycle] = useState<BillingCycle | null>(null);
  const [receipt, setReceipt] = useState<RecordPaymentResult | null>(null);
  // KPI stopwatch — from "enrollment chosen" to "receipt issued" (Product gate).
  const startedAt = useRef<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState<number | null>(null);

  // Sell inputs
  const [sessionsSold, setSessionsSold] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [priceOverride, setPriceOverride] = useState<string>("");
  const [sellNote, setSellNote] = useState<string>("");
  // Collect inputs
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [payNote, setPayNote] = useState<string>("");

  const { data: enrollmentsData, isLoading: isEnrollmentsLoading } = useEnrollments({
    search,
    status: "ACTIVE",
    page: 1,
    limit: 20,
  });

  const {
    data: cyclesData,
    isLoading: isCyclesLoading,
    isError: isCyclesError,
  } = useBillingCycles({ enrollmentId: selected?.id, enabled: Boolean(selected) });

  const sellMutation = useSellPackage();
  const payMutation = useRecordPayment();

  const collectibleFromServer = useMemo(
    () => cyclesData?.items.find(isCollectible) ?? null,
    [cyclesData]
  );
  const activeCycle = soldCycle ?? collectibleFromServer;

  const canCollect = hasPermission(PERMISSIONS.PAYMENT_CREATE);

  const resetTransaction = () => {
    setSelected(null);
    setSoldCycle(null);
    setReceipt(null);
    setSessionsSold("");
    setDiscount("");
    setPriceOverride("");
    setSellNote("");
    setAmount("");
    setMethod("CASH");
    setPayNote("");
    startedAt.current = null;
    setElapsedSec(null);
    setSearch("");
  };

  const chooseEnrollment = (e: Enrollment) => {
    setSelected(e);
    setSoldCycle(null);
    setReceipt(null);
    setSessionsSold(
      typeof e.remaining === "number" && e.remaining > 0
        ? String(e.remaining)
        : String(e.billingCycleSessions ?? "")
    );
    setPickerOpen(false);
    startedAt.current = Date.now();
    setElapsedSec(null);
  };

  const handleSell = async () => {
    if (!selected) return;
    try {
      const cycle = await sellMutation.mutateAsync({
        enrollmentId: selected.id,
        sessionsSold: sessionsSold ? Number(sessionsSold) : undefined,
        discount: discount ? Number(discount) : undefined,
        priceOverride: priceOverride ? Number(priceOverride) : undefined,
        note: sellNote || undefined,
      });
      setSoldCycle(cycle);
      setAmount(String(cycle.outstanding));
      emitToast("Đã tạo công nợ — tiến hành thu tiền", "success");
    } catch (err) {
      emitToast(extractErrorMessage(err), "error");
    }
  };

  const handleCollect = async () => {
    if (!activeCycle) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      emitToast("Số tiền không hợp lệ", "error");
      return;
    }
    try {
      const result = await payMutation.mutateAsync({
        billingCycleId: activeCycle.id,
        amount: value,
        method,
        note: payNote || undefined,
      });
      setReceipt(result);
      // Freeze the KPI stopwatch on the first receipt of the transaction.
      if (startedAt.current && elapsedSec === null) {
        setElapsedSec(Math.round((Date.now() - startedAt.current) / 1000));
      }
      // Installment: keep collecting against the same cycle if it still owes.
      if (result.outstanding > 0) {
        setSoldCycle({
          ...activeCycle,
          outstanding: result.outstanding,
          status: result.cycleStatus,
        });
        setAmount(String(result.outstanding));
      } else {
        setSoldCycle(null);
      }
      setPayNote("");
      emitToast("Đã thu tiền & xuất biên lai", "success");
    } catch (err) {
      emitToast(extractErrorMessage(err), "error");
    }
  };

  const enrollmentIdParam = searchParams.get("enrollmentId");
  // Deep-link support: /payments?enrollmentId=... preselects (best-effort, once).
  useEffect(() => {
    if (!enrollmentIdParam || selected) return;
    const match = enrollmentsData?.items.find((e) => e.id === enrollmentIdParam);
    if (match) chooseEnrollment(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentIdParam, enrollmentsData]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Thu học phí</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Chọn đăng ký → bán gói → thu tiền → biên lai, trong một màn hình
            </p>
          </div>
        </div>
        {selected && (
          <button
            onClick={resetTransaction}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Giao dịch mới</span>
          </button>
        )}
      </div>

      {/* ── Step 1 · Choose enrollment ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            1
          </span>
          <h3 className="text-sm font-semibold text-slate-800">Đăng ký học</h3>
        </div>

        {selected ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{studentName(selected)}</p>
              <p className="truncate text-xs text-slate-500">
                {selected.student?.code ?? "—"} · {selected.class?.name ?? "—"}
              </p>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                setSoldCycle(null);
                setReceipt(null);
                setPickerOpen(true);
              }}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Đổi
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPickerOpen(true);
                }}
                onFocus={() => setPickerOpen(true)}
                placeholder="Tìm học sinh theo tên, mã, lớp..."
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
            {pickerOpen && (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {isEnrollmentsLoading ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">Đang tải...</div>
                ) : (enrollmentsData?.items.length ?? 0) === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    Không có đăng ký học đang hoạt động
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {enrollmentsData?.items.map((e) => (
                      <li key={e.id}>
                        <button
                          onClick={() => chooseEnrollment(e)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{studentName(e)}</p>
                            <p className="truncate text-xs text-slate-500">
                              {e.student?.code ?? "—"} · {e.class?.name ?? "—"}
                            </p>
                          </div>
                          {typeof e.remaining === "number" && (
                            <span className="shrink-0 text-xs text-slate-400">
                              còn {e.remaining}/{e.billingCycleSessions} buổi
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Step 2 · Sell (only if no collectible cycle) ───────────────────────── */}
      {selected && !receipt && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              2
            </span>
            <h3 className="text-sm font-semibold text-slate-800">Gói học phí</h3>
          </div>

          {isCyclesLoading ? (
            <div className="py-6 text-center text-sm text-slate-400">Đang tải chu kỳ...</div>
          ) : isCyclesError ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <p className="text-sm text-slate-500">Không thể tải chu kỳ thanh toán</p>
            </div>
          ) : activeCycle ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Đã có công nợ cần thu — bỏ qua bước bán gói
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeCycle.sessionsSold} buổi · giá {formatCurrency(activeCycle.snapshotPrice)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-green-500" />
            </div>
          ) : (
            <Can
              permission={PERMISSIONS.BILLING_CREATE}
              fallback={
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Bạn không có quyền bán gói.
                </p>
              }
            >
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">Số buổi</span>
                    <input
                      type="number"
                      min={1}
                      value={sessionsSold}
                      onChange={(e) => setSessionsSold(e.target.value)}
                      className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">Chiết khấu (đ)</span>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <Can permission={PERMISSIONS.BILLING_OVERRIDE}>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">
                      Giá tự nhập (đ) — để trống dùng giá theo tỉ lệ buổi còn lại
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={priceOverride}
                      onChange={(e) => setPriceOverride(e.target.value)}
                      placeholder="Tự động tính theo hệ thống"
                      className="h-10 rounded-xl border border-slate-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </Can>
                <button
                  onClick={handleSell}
                  disabled={sellMutation.isPending}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sellMutation.isPending ? "Đang tạo công nợ..." : "Bán gói & tạo công nợ"}
                </button>
              </div>
            </Can>
          )}
        </section>
      )}

      {/* ── Step 3 · Collect ───────────────────────────────────────────────────── */}
      {activeCycle && !receipt && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                3
              </span>
              <h3 className="text-sm font-semibold text-slate-800">Thu tiền</h3>
            </div>
            <StatusBadge status={activeCycle.status} />
          </div>

          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-500">Còn phải thu</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(activeCycle.outstanding)}
            </span>
          </div>

          <Can
            permission={PERMISSIONS.PAYMENT_CREATE}
            fallback={
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Bạn không có quyền thu tiền.
              </p>
            }
          >
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Số tiền nhận</span>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11 rounded-xl border border-slate-300 px-3 text-base font-semibold focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400">
                  Thu nhiều hơn công nợ → phần thừa tự động thành credit của học sinh
                </span>
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Hình thức</span>
                <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        method === m
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {PAYMENT_METHOD_CONFIG[m].label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCollect}
                disabled={payMutation.isPending || !canCollect}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ReceiptIcon className="h-4 w-4" />
                {payMutation.isPending ? "Đang xử lý..." : "Thu tiền & xuất biên lai"}
              </button>
            </div>
          </Can>
        </section>
      )}

      {/* ── Receipt ────────────────────────────────────────────────────────────── */}
      {receipt && (
        <section className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-green-100 bg-green-50 px-5 py-4">
            <BadgeCheck className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Thu tiền thành công</p>
              <p className="text-xs text-green-700">Biên lai {receipt.receiptCode}</p>
            </div>
            {elapsedSec !== null && (
              <span
                className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-medium text-green-700"
                title="Thời gian hoàn tất giao dịch (từ lúc chọn đăng ký)"
              >
                Hoàn tất trong {elapsedSec}s
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2.5 px-5 py-4 text-sm">
            <ReceiptRow label="Đã thu" value={formatCurrency(receipt.settled)} strong />
            {receipt.credited > 0 && (
              <ReceiptRow
                label="Tiền thừa → credit"
                value={formatCurrency(receipt.credited)}
                tone="credit"
              />
            )}
            <ReceiptRow label="Hình thức" value={PAYMENT_METHOD_CONFIG[receipt.method].label} />
            <ReceiptRow
              label="Còn phải thu"
              value={formatCurrency(receipt.outstanding)}
              tone={receipt.outstanding > 0 ? "warning" : undefined}
            />
            <ReceiptRow
              label="Trạng thái chu kỳ"
              value={<StatusBadge status={receipt.cycleStatus} />}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
            {receipt.outstanding > 0 && canCollect && (
              <button
                onClick={() => setReceipt(null)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Coins className="h-4 w-4" />
                Thu thêm
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-4 w-4" />
              In biên lai
            </button>
            <button
              onClick={resetTransaction}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Giao dịch mới
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BillingCycle["status"] }) {
  const cfg = BILLING_CYCLE_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
        cfg.cls
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ReceiptRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  tone?: "credit" | "warning";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          "font-medium text-slate-900",
          strong && "text-base font-bold",
          tone === "credit" && "text-indigo-600",
          tone === "warning" && "text-amber-600"
        )}
      >
        {value}
      </span>
    </div>
  );
}
