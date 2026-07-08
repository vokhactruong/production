import { api } from "../../../lib/api-client";

// Mirrors the fixed API surface (docs/slices/slice-01-attendance):
// - POST /attendance/sessions/:sessionId — idempotent bulk roster recording
// - GET  /attendance                     — paginated { items, meta } list
// - PATCH /attendance/:id                — correction (status/note only)
// No delete call on purpose: attendance is participation evidence —
// corrections only, never deletes.
export const attendanceApi = {
  getAll: (p?: unknown) => api.get("/attendance", { params: p }),
  recordSession: (sessionId: string, d: unknown) =>
    api.post(`/attendance/sessions/${sessionId}`, d),
  correct: (id: string, d: unknown) => api.patch(`/attendance/${id}`, d),
};
