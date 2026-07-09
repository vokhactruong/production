import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { PaymentsRepository } from "./payments.repository";
import { DerivedMoneyService } from "./derived-money.service";
import { RecordPaymentDto, PaymentQueryDto } from "./dto/payment.dto";

export function receiptCode(n: number): string {
  return `RC-${String(n).padStart(6, "0")}`;
}

@Injectable()
export class PaymentRecordingService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly auditLogs: AuditLogsService,
    private readonly derivedMoney: DerivedMoneyService
  ) {}

  /**
   * Record a payment against a cycle in ONE flow (the <1-minute KPI). Mints a
   * receipt (global sequence, D17 on the PAYMENT row) and, iff the amount
   * exceeds what is owed, grants the overage as credit — both rows written in a
   * SINGLE createMany statement (⚑5: atomic on Postgres, no interactive
   * transaction, no pgbouncer exposure). Settling a PENDING cycle activates it
   * (F2 fast path); the read path is the convergence safety net.
   */
  async recordPayment(dto: RecordPaymentDto, actorId: string) {
    const cycle = await this.repo.findCycleById(dto.billingCycleId);
    if (!cycle) throw new NotFoundException("Chu kỳ thanh toán không tồn tại");

    const outstanding = await this.derivedMoney.getOutstandingForCycle(cycle.id);
    if (outstanding <= 0) {
      // No debt to settle → this would be a deposit, and credit has exactly two
      // sources (withdrawal + overpayment, BI-9). Overpayment only exists when a
      // cycle owes something, so recording a payment here is rejected.
      throw new BadRequestException("Chu kỳ thanh toán đã được thanh toán đủ");
    }

    const settleAmount = Math.min(dto.amount, outstanding);
    const overpay = dto.amount - outstanding; // > 0 ⇒ overpayment → credit

    const receiptNumber = await this.repo.nextReceiptNumber();

    const rows: Prisma.LedgerEntryCreateManyInput[] = [
      {
        type: "PAYMENT",
        amount: settleAmount,
        studentId: cycle.enrollment.studentId,
        billingCycleId: cycle.id,
        method: dto.method,
        receiptNumber,
        createdById: actorId,
        note: dto.note,
      },
    ];
    if (overpay > 0) {
      rows.push({
        type: "CREDIT_GRANT",
        amount: overpay,
        studentId: cycle.enrollment.studentId,
        billingCycleId: cycle.id,
        creditSource: "OVERPAYMENT",
        refundStatus: "NOT_REFUNDED",
        createdById: actorId,
        note: "Tiền thừa chuyển thành credit",
      });
    }

    await this.repo.createLedgerEntries(rows); // single atomic statement (⚑5)

    // F2 fast path: a fully-paid PENDING cycle becomes ACTIVE (Q3). Guarded by
    // the one-ACTIVE partial-unique; if another ACTIVE exists (P2002), leave it —
    // the enrollment read-path self-heal reconciles ("Evidence heals state").
    let cycleStatus = cycle.status;
    if (cycle.status === "PENDING" && (await this.derivedMoney.isCycleFullyPaid(cycle.id))) {
      try {
        await this.repo.updateCycleStatus(cycle.id, "ACTIVE");
        cycleStatus = "ACTIVE";
      } catch (err) {
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"))
          throw err;
      }
    }

    await this.auditLogs.log({
      userId: actorId,
      action: "CREATE",
      entity: "Payment",
      entityId: cycle.id,
      metadata: {
        after: {
          receiptNumber,
          settled: settleAmount,
          credited: overpay > 0 ? overpay : 0,
          method: dto.method,
        },
      },
    });

    const newOutstanding = await this.derivedMoney.getOutstandingForCycle(cycle.id);
    return {
      receiptNumber,
      receiptCode: receiptCode(receiptNumber),
      billingCycleId: cycle.id,
      studentId: cycle.enrollment.studentId,
      amountReceived: dto.amount,
      settled: settleAmount,
      credited: overpay > 0 ? overpay : 0,
      method: dto.method,
      cycleStatus,
      outstanding: newOutstanding,
    };
  }

  /** List recorded payments (PAYMENT ledger rows) with their receipt code. */
  async findPayments(query: PaymentQueryDto) {
    const { studentId, billingCycleId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where = {
      type: "PAYMENT" as const,
      deletedAt: null,
      ...(studentId && { studentId }),
      ...(billingCycleId && { billingCycleId }),
    };
    const [items, total] = await Promise.all([
      this.repo.findLedger({ where, skip, take: limit }),
      this.repo.countLedger(where),
    ]);
    return {
      items: items.map((r) => ({
        ...r,
        receiptCode: r.receiptNumber !== null ? receiptCode(r.receiptNumber) : null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Reprint a receipt by its permanent number (Q8 reusable shape). */
  async findReceipt(receiptNumber: number) {
    const row = await this.repo.findByReceiptNumber(receiptNumber);
    if (!row || row.receiptNumber === null) {
      throw new NotFoundException("Không tìm thấy biên lai");
    }
    return { ...row, receiptCode: receiptCode(row.receiptNumber) };
  }
}
