import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "../api/classes.api";
import { getData } from "../../../lib/api-client";
import { classKeys } from "./query-keys";
import type { Class } from "../../../types";

export function useUpdateClass(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => classesApi.update(id, data),
    onSuccess: (response) => {
      qc.setQueryData<Class>(classKeys.detail(id), getData<Class>(response));
    },
  });
}
