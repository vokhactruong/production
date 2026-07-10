import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import { getData } from "../../../lib/api-client";
import { billingCycleKeys, paymentKeys } from "./query-keys";
import { enrollmentKeys } from "../../enrollments/hooks/query-keys";
import type { BillingCycle, SellPackagePayload } from "../types";

// Selling a package creates a PENDING cycle + the CHARGE that IS the debt.
// Cross-module invalidation is intentional: an enrollment's renewal/remaining is
// derived on its read path, so a new cycle must invalidate enrollment reads
// (CACHE.md / QUERY_KEYS.md). The Owner summary's outstanding also moves.
export function useSellPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SellPackagePayload) =>
      paymentsApi.sellPackage(payload).then((res) => getData<BillingCycle>(res)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingCycleKeys.lists() });
      qc.invalidateQueries({ queryKey: paymentKeys.summary() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.details() });
    },
  });
}
