import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { ClassroomsController } from "./classrooms.controller";
import { ClassroomsService } from "./classrooms.service";
import { ClassroomsRepository } from "./classrooms.repository";

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [ClassroomsController],
  providers: [ClassroomsService, ClassroomsRepository],
  exports: [ClassroomsService],
})
export class ClassroomsModule {}
