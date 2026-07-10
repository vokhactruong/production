import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import { getList } from "../../../lib/api-client";
import { paymentKeys } from "./query-keys";
import type { LedgerEntry } from "../types";

interface PaymentFilters {
  studentId?: string;
  billingCycleId?: string;
  page?: number;
}

export function usePayments(filters: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () =>
      paymentsApi
        .getPayments({
          studentId: filters.studentId || undefined,
          billingCycleId: filters.billingCycleId || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<LedgerEntry>(res)),
  });
}
