import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import { getData } from "../../../lib/api-client";
import { paymentKeys } from "./query-keys";
import type { MoneySummary } from "../types";

// The Owner's real-time money view (Q10). Revenue, outstanding and credit
// liability arrive as three separate derived figures (BI-10) — the component
// renders them side by side, never summed together.
export function useMoneySummary() {
  return useQuery({
    queryKey: paymentKeys.summary(),
    queryFn: () => paymentsApi.getSummary().then((res) => getData<MoneySummary>(res)),
  });
}
