// View models over the frozen Payment API surface (docs/slices/slice-02-payment).
// Money is DERIVED, never a stored counter (BI-7): the client only displays these
// figures — it never computes owed / revenue / credit itself. Decimal columns
// (snapshotPrice, amount) arrive as strings over JSON; derived figures
// (outstanding, settled, credited, summary) arrive as numbers.

export type BillingCycleStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER";
export type LedgerEntryType = "CHARGE" | "PAYMENT" | "CREDIT_GRANT" | "CREDIT_OFFSET" | "REFUND";
export type CreditRefundStatus = "NOT_REFUNDED" | "REFUNDED";
export type CreditSource = "OVERPAYMENT" | "WITHDRAWAL";

export interface BillingCycleStudent {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
}

export interface BillingCycleEnrollment {
  id: string;
  studentId: string;
  classId: string;
  student: BillingCycleStudent;
}

export interface BillingCycle {
  id: string;
  enrollmentId: string;
  status: BillingCycleStatus;
  snapshotPrice: string;
  snapshotDiscount: string | null;
  sessionsSold: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  enrollment: BillingCycleEnrollment;
  /** Derived (Σ CHARGE − Σ PAYMENT − Σ CREDIT_OFFSET) — additive read field. */
  outstanding: number;
}

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: string;
  studentId: string;
  billingCycleId: string | null;
  method: PaymentMethod | null;
  receiptNumber: number | null;
  creditSource: CreditSource | null;
  refundStatus: CreditRefundStatus | null;
  note: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  /** RC-formatted receipt code, present on PAYMENT rows. */
  receiptCode?: string | null;
  /** Joined on the credit list (display only — who a refund pays back). */
  student?: BillingCycleStudent;
}

/** The single round-trip result of recording a payment (the <1-minute flow). */
export interface RecordPaymentResult {
  receiptNumber: number;
  receiptCode: string;
  billingCycleId: string;
  studentId: string;
  amountReceived: number;
  settled: number;
  /** Overpayment turned into student credit, inline — no second screen. */
  credited: number;
  method: PaymentMethod;
  cycleStatus: BillingCycleStatus;
  outstanding: number;
}

/** The Owner money view — three STRICTLY separate figures, never blended (BI-10). */
export interface MoneySummary {
  revenue: number;
  outstanding: number;
  creditLiability: number;
}

export interface SellPackagePayload {
  enrollmentId: string;
  sessionsSold?: number;
  priceOverride?: number;
  discount?: number;
  note?: string;
}

export interface RecordPaymentPayload {
  billingCycleId: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
}
