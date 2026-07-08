/**
 * Business Policy Interface (Founder decision D1 — Dependency Inversion at
 * completion). Session completion is gated by business policies it does not
 * know by name: ClassSessionsService injects only this token/interface and
 * asks "may this session complete?" — it never imports attendance (or any
 * other capability's) internals. Today the attendance module provides the
 * implementation (E1: every ACTIVE enrollment must have a recorded attendance
 * status — EXCUSED counts as finalized); completion may later compose more
 * policies (Safety, Payment Hold, …) behind this same seam.
 *
 * Note: NO consumption code runs at completion. Lesson consumption is derived
 * (a COUNT over deducting attendance rows on COMPLETED sessions), so the
 * session *being* COMPLETED is what makes its rows count — nothing to execute,
 * nothing to transact.
 */
export interface SessionCompletionPolicy {
  /**
   * Throws BadRequestException when the session may not transition to
   * COMPLETED (e.g. some ACTIVE enrollments are still unmarked).
   */
  assertSessionCompletable(classSessionId: string): Promise<void>;
}

export const SESSION_COMPLETION_POLICY = Symbol("SESSION_COMPLETION_POLICY");
