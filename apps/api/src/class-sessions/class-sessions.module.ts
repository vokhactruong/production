import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { ClassSessionsController } from "./class-sessions.controller";
import { ClassSessionsService } from "./class-sessions.service";
import { ClassSessionsRepository } from "./class-sessions.repository";

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService, ClassSessionsRepository],
  // ClassSessionsRepository is exported too: SchedulingService (in the
  // scheduling module) creates ClassSession rows directly to run the
  // session-generation algorithm.
  exports: [ClassSessionsService, ClassSessionsRepository],
})
export class ClassSessionsModule {}
