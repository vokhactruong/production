import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";
import { CoursesRepository } from "./courses.repository";

@Module({
  imports: [AuthModule, AuditLogsModule],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository],
  exports: [CoursesService],
})
export class CoursesModule {}
