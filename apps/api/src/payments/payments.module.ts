import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsRepository } from "./payments.repository";
import { DerivedMoneyService } from "./derived-money.service";
import { BillingService } from "./billing.service";
import { PaymentRecordingService } from "./payment-recording.service";
import { CreditService } from "./credit.service";

@Module({
  // AttendanceModule provides LessonConsumptionService — pro-rata pricing (OQ-A)
  // and capacity-based FIFO attribution (P4) read the derived lesson total; the
  // consumption service itself is never modified by Payment (Q2 separation).
  imports: [AuthModule, AuditLogsModule, AttendanceModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsRepository,
    DerivedMoneyService,
    BillingService,
    PaymentRecordingService,
    CreditService,
  ],
  // BillingService is exported so the enrollment read path can call reconcile()
  // (T2 lazy renewal + F2 self-heal); DerivedMoneyService for money reads.
  exports: [DerivedMoneyService, BillingService, PaymentsRepository],
})
export class PaymentsModule {}
