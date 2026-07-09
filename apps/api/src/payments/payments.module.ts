import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsRepository } from "./payments.repository";
import { DerivedMoneyService } from "./derived-money.service";
import { BillingService } from "./billing.service";
import { PaymentRecordingService } from "./payment-recording.service";

@Module({
  // AttendanceModule provides LessonConsumptionService — pro-rata pricing (OQ-A)
  // and capacity-based FIFO attribution (P4) read the derived lesson total; the
  // consumption service itself is never modified by Payment (Q2 separation).
  imports: [AuthModule, AuditLogsModule, AttendanceModule],
  controllers: [PaymentsController],
  providers: [PaymentsRepository, DerivedMoneyService, BillingService, PaymentRecordingService],
  exports: [DerivedMoneyService, PaymentsRepository],
})
export class PaymentsModule {}
