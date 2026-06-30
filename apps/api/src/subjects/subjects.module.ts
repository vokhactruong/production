import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { SubjectsController } from "./subjects.controller";
import { SubjectsService } from "./subjects.service";
import { SubjectsRepository } from "./subjects.repository";

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [SubjectsController],
  providers: [SubjectsService, SubjectsRepository],
  exports: [SubjectsService],
})
export class SubjectsModule {}
