import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import { getList } from "../../../lib/api-client";
import { creditKeys } from "./query-keys";
import type { LedgerEntry } from "../types";

interface CreditFilters {
  studentId?: string;
  page?: number;
}

export function useCredits(filters: CreditFilters) {
  return useQuery({
    queryKey: creditKeys.list(filters),
    queryFn: () =>
      paymentsApi
        .getCredits({
          studentId: filters.studentId || undefined,
          page: filters.page,
          limit: 10,
        })
        .then((res) => getList<LedgerEntry>(res)),
  });
}
