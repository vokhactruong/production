// The payments feature spans three ledger-backed resources; each owns a factory
// (QUERY_KEYS.md). `summary` is a statistics-style key, kept separate from lists.

export const billingCycleKeys = {
  all: ["billing-cycles"] as const,
  lists: () => [...billingCycleKeys.all, "list"] as const,
  list: (filters: { enrollmentId?: string; studentId?: string; status?: string; page?: number }) =>
    [...billingCycleKeys.lists(), filters] as const,
  details: () => [...billingCycleKeys.all, "detail"] as const,
  detail: (id: string) => [...billingCycleKeys.details(), id] as const,
};

export const paymentKeys = {
  all: ["payments"] as const,
  summary: () => [...paymentKeys.all, "summary"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: { studentId?: string; billingCycleId?: string; page?: number }) =>
    [...paymentKeys.lists(), filters] as const,
  receipts: () => [...paymentKeys.all, "receipt"] as const,
  receipt: (receiptNumber: number) => [...paymentKeys.receipts(), receiptNumber] as const,
};

export const creditKeys = {
  all: ["credits"] as const,
  lists: () => [...creditKeys.all, "list"] as const,
  list: (filters: { studentId?: string; page?: number }) =>
    [...creditKeys.lists(), filters] as const,
};
