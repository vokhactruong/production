import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import { getData } from "../../../lib/api-client";
import { billingCycleKeys, paymentKeys, creditKeys } from "./query-keys";
import { enrollmentKeys } from "../../enrollments/hooks/query-keys";
import type { RecordPaymentResult, RecordPaymentPayload } from "../types";

// One flow, one round-trip (the <1-minute KPI): the result carries the receipt,
// the settled amount, any inline overpayment-credit, and the new outstanding.
// A settling payment activates the cycle (F2), so enrollment reads (which derive
// remaining/renewal and self-heal cycle status) are invalidated too; an
// overpayment mints credit, so credit lists move as well.
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordPaymentPayload) =>
      paymentsApi.recordPayment(payload).then((res) => getData<RecordPaymentResult>(res)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingCycleKeys.lists() });
      qc.invalidateQueries({ queryKey: paymentKeys.lists() });
      qc.invalidateQueries({ queryKey: paymentKeys.summary() });
      qc.invalidateQueries({ queryKey: creditKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.lists() });
      qc.invalidateQueries({ queryKey: enrollmentKeys.details() });
    },
  });
}
