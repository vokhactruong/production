import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import { getData } from "../../../lib/api-client";
import { creditKeys, paymentKeys } from "./query-keys";

interface RefundResult {
  creditGrantId: string;
  studentId: string;
  refunded: number;
  creditBalance: number;
}

// Refund is a status transition (NOT_REFUNDED → REFUNDED) — money is never
// erased (D18/BI-6), the derived credit balance simply drops. Credit lists and
// the Owner liability figure both move.
export function useRefundCredit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      paymentsApi.refundCredit(id, { note }).then((res) => getData<RefundResult>(res)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: creditKeys.lists() });
      qc.invalidateQueries({ queryKey: paymentKeys.summary() });
    },
  });
}
