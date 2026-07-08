import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { ClassSessionsController } from "./class-sessions.controller";
import { ClassSessionsService } from "./class-sessions.service";
import { ClassSessionsRepository } from "./class-sessions.repository";

@Module({
  // AttendanceModule is imported ONLY for the SESSION_COMPLETION_POLICY
  // provider it exports (Business Policy Interface, declared by THIS module in
  // session-completion.policy.ts). ClassSessionsService injects the token —
  // no attendance internals are referenced anywhere in this module's code.
  imports: [AuthModule, AuditLogsModule, AttendanceModule],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService, ClassSessionsRepository],
  // ClassSessionsRepository is exported too: SchedulingService (in the
  // scheduling module) creates ClassSession rows directly to run the
  // session-generation algorithm.
  exports: [ClassSessionsService, ClassSessionsRepository],
})
export class ClassSessionsModule {}
