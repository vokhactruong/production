import { useMutation } from "@tanstack/react-query";
import { classesApi } from "../../classes/api/classes.api";
import { getData } from "../../../lib/api-client";
import type { GenerateSessionsResult } from "../../../types";

export function useGenerateSessions(classId: string) {
  return useMutation({
    mutationFn: () =>
      classesApi.generateSessions(classId).then((res) => getData<GenerateSessionsResult>(res)),
  });
}
