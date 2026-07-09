import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { PaymentsModule } from "../payments/payments.module";
import { EnrollmentsController } from "./enrollments.controller";
import { EnrollmentsService } from "./enrollments.service";
import { EnrollmentsRepository } from "./enrollments.repository";

@Module({
  // AttendanceModule provides LessonConsumptionService: the enrollment read
  // path exposes the derived lesson balance (consumed/remaining) — a query
  // over attendance evidence, never a stored counter. PaymentsModule provides
  // BillingService for T2 lazy renewal / F2 self-heal on the detail read path.
  imports: [AuthModule, AuditLogsModule, AttendanceModule, PaymentsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentsRepository],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
