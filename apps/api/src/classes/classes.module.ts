import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { SchedulingModule } from "../scheduling/scheduling.module";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";
import { ClassesRepository } from "./classes.repository";

@Module({
  imports: [AuthModule, AuditLogsModule, SchedulingModule],
  controllers: [ClassesController],
  providers: [ClassesService, ClassesRepository],
  exports: [ClassesService],
})
export class ClassesModule {}
