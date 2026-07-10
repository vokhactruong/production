import type { BillingCycleStatus, PaymentMethod } from "../../features/payments/types";

export const BILLING_CYCLE_STATUS_CONFIG: Record<
  BillingCycleStatus,
  { label: string; cls: string; dot: string }
> = {
  PENDING: {
    label: "Chờ thanh toán",
    cls: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  ACTIVE: {
    label: "Đang hiệu lực",
    cls: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    cls: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    cls: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER"];

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string }> = {
  CASH: { label: "Tiền mặt" },
  BANK_TRANSFER: { label: "Chuyển khoản" },
};
