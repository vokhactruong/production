import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import { getList } from "../../../lib/api-client";
import { billingCycleKeys } from "./query-keys";
import type { BillingCycle } from "../types";

interface BillingCycleFilters {
  enrollmentId?: string;
  studentId?: string;
  status?: string;
  page?: number;
  enabled?: boolean;
}

export function useBillingCycles(filters: BillingCycleFilters) {
  const { enabled = true, ...query } = filters;
  return useQuery({
    queryKey: billingCycleKeys.list(query),
    enabled,
    queryFn: () =>
      paymentsApi
        .getBillingCycles({
          enrollmentId: query.enrollmentId || undefined,
          studentId: query.studentId || undefined,
          status: query.status || undefined,
          page: query.page,
          limit: 10,
        })
        .then((res) => getList<BillingCycle>(res)),
  });
}
