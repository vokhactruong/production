import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { SESSION_COMPLETION_POLICY } from "../class-sessions/session-completion.policy";
import { AttendanceController } from "./attendance.controller";
import { AttendanceApplicationService } from "./attendance-application.service";
import { LessonConsumptionService } from "./lesson-consumption.service";
import { AttendanceRepository } from "./attendance.repository";

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceApplicationService,
    LessonConsumptionService,
    AttendanceRepository,
    // Business Policy Interface (D1): this module PROVIDES the session
    // completion policy behind the token declared by the class-sessions
    // module. ClassSessionsService injects only the token — it never names
    // Attendance.
    { provide: SESSION_COMPLETION_POLICY, useExisting: AttendanceApplicationService },
  ],
  // LessonConsumptionService is exported for derived-balance reads (e.g. the
  // enrollments read path exposes consumed/remaining); the policy token is
  // exported for the class-sessions completion seam.
  exports: [LessonConsumptionService, SESSION_COMPLETION_POLICY],
})
export class AttendanceModule {}
