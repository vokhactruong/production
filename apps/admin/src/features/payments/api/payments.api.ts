import { api } from "../../../lib/api-client";

// Mirrors the frozen Payment API surface (docs/slices/slice-02-payment,
// binding item 11). No RPC verbs: activation is a consequence of a settling
// payment, never a call. Credit is a branch of the payment flow, not a module.
export const paymentsApi = {
  // Billing cycles (sell a package = create cycle + CHARGE debt)
  sellPackage: (d: unknown) => api.post("/billing-cycles", d),
  getBillingCycles: (p?: unknown) => api.get("/billing-cycles", { params: p }),
  getBillingCycle: (id: string) => api.get(`/billing-cycles/${id}`),

  // Payments + receipts (record payment; overpayment → credit inline)
  recordPayment: (d: unknown) => api.post("/payments", d),
  getPayments: (p?: unknown) => api.get("/payments", { params: p }),
  getReceipt: (receiptNumber: number) => api.get(`/payments/receipt/${receiptNumber}`),
  getSummary: () => api.get("/payments/summary"),

  // Credit (withdrawal · offset · refund — student-scoped)
  getCredits: (p?: unknown) => api.get("/credits", { params: p }),
  withdrawCredit: (d: unknown) => api.post("/credits/withdraw", d),
  offsetCredit: (d: unknown) => api.post("/credits/offset", d),
  refundCredit: (id: string, d: unknown) => api.patch(`/credits/${id}/refund`, d),
};
