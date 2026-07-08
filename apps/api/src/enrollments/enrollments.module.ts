import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { EnrollmentsController } from "./enrollments.controller";
import { EnrollmentsService } from "./enrollments.service";
import { EnrollmentsRepository } from "./enrollments.repository";

@Module({
  // AttendanceModule provides LessonConsumptionService: the enrollment read
  // path exposes the derived lesson balance (consumed/remaining) — a query
  // over attendance evidence, never a stored counter.
  imports: [AuthModule, AuditLogsModule, AttendanceModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentsRepository],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
