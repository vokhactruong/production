import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { ClassSchedulesController } from "./class-schedules.controller";
import { ClassSchedulesService } from "./class-schedules.service";
import { ClassSchedulesRepository } from "./class-schedules.repository";

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [ClassSchedulesController],
  providers: [ClassSchedulesService, ClassSchedulesRepository],
  // ClassSchedulesRepository is exported too: SchedulingService (in the
  // scheduling module) reads active schedule slots directly to run the
  // session-generation algorithm.
  exports: [ClassSchedulesService, ClassSchedulesRepository],
})
export class ClassSchedulesModule {}
