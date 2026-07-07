import { Module } from "@nestjs/common";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { ClassSessionsModule } from "../class-sessions/class-sessions.module";
import { ClassSchedulesModule } from "../class-schedules/class-schedules.module";
import { SchedulingService } from "./scheduling.service";

@Module({
  imports: [AuditLogsModule, ClassSessionsModule, ClassSchedulesModule],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
