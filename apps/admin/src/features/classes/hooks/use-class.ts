import { useQuery } from "@tanstack/react-query";
import { classesApi } from "../api/classes.api";
import { getData } from "../../../lib/api-client";
import { classKeys } from "./query-keys";
import type { Class } from "../../../types";

export function useClass(id: string | undefined) {
  return useQuery({
    queryKey: classKeys.detail(id ?? ""),
    queryFn: () => classesApi.getOne(id!).then((res) => getData<Class>(res)),
    enabled: Boolean(id),
  });
}
