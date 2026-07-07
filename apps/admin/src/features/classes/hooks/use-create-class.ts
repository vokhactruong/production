import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "../api/classes.api";
import { getData } from "../../../lib/api-client";
import { classKeys } from "./query-keys";
import type { Class } from "../../../types";

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => classesApi.create(data),
    onSuccess: (response) => {
      const created = getData<Class>(response);
      qc.setQueryData<Class>(classKeys.detail(created.id), created);
    },
  });
}
