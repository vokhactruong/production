import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { PaymentsRepository } from "./payments.repository";
import { DerivedMoneyService } from "./derived-money.service";
import {
  WithdrawCreditDto,
  OffsetCreditDto,
  RefundCreditDto,
  CreditQueryDto,
} from "./dto/payment.dto";

/**
 * Credit is a branch INSIDE the payment domain (never a separate module) —
 * student-scoped (OQ-D). Two sources only (BI-9): withdrawal (unused paid value)
 * and overpayment (handled in PaymentRecordingService). Two functions: offset
 * (CREDIT_OFFSET reduces owed AND liability by the same amount — BI-10 conserved)
 * and refund (a REFUND row draws the balance down; the grant is flagged REFUNDED
 * so it is never refunded twice). Append-only; the ledger is never hard-deleted
 * (D18/BI-6). Value is conserved end to end (BI-11).
 */
@Injectable()
export class CreditService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly auditLogs: AuditLogsService,
    private readonly derivedMoney: DerivedMoneyService
  ) {}

  /** Withdrawal: the unused portion of what was PAID for a cycle becomes credit,
   * and the cycle is cancelled. Never returns more than was paid (conservation). */
  async withdraw(dto: WithdrawCreditDto, actorId: string) {
    const cycle = await this.repo.findCycleById(dto.billingCycleId);
    if (!cycle) throw new NotFoundException("Chu kỳ thanh toán không tồn tại");
    if (cycle.status === "CANCELLED") {
      throw new BadRequestException("Chu kỳ thanh toán đã bị hủy");
    }

    const remainingMap = await this.derivedMoney.getCycleRemainingMap(cycle.enrollmentId);
    const remaining = remainingMap.get(cycle.id) ?? cycle.sessionsSold;
    const paid = await this.derivedMoney.getPaidByCycleId(cycle.id);
    // Unused value = the paid amount attributable to lessons not taken.
    const unusedValue =
      cycle.sessionsSold > 0 ? Math.round((paid * remaining) / cycle.sessionsSold) : 0;

    if (unusedValue > 0) {
      await this.repo.createLedgerEntries([
        {
          type: "CREDIT_GRANT",
          amount: unusedValue,
          studentId: cycle.enrollment.studentId,
          billingCycleId: cycle.id,
          creditSource: "WITHDRAWAL",
          refundStatus: "NOT_REFUNDED",
          createdById: actorId,
          note: dto.note ?? "Rút gói — giá trị chưa dùng chuyển thành credit",
        },
      ]);
    }
    await this.repo.updateCycleStatus(cycle.id, "CANCELLED");

    await this.auditLogs.log({
      userId: actorId,
      action: "UPDATE",
      entity: "BillingCycle",
      entityId: cycle.id,
      metadata: { after: { status: "CANCELLED", creditGranted: unusedValue } },
    });

    return {
      billingCycleId: cycle.id,
      studentId: cycle.enrollment.studentId,
      creditGranted: unusedValue,
      creditBalance: await this.derivedMoney.getCreditBalanceForStudent(cycle.enrollment.studentId),
    };
  }

  /** Offset: apply available student credit against a cycle's outstanding. One
   * CREDIT_OFFSET row lowers owed and liability by the same amount (BI-10). */
  async offset(dto: OffsetCreditDto, actorId: string) {
    const cycle = await this.repo.findCycleById(dto.billingCycleId);
    if (!cycle) throw new NotFoundException("Chu kỳ thanh toán không tồn tại");

    const studentId = cycle.enrollment.studentId;
    const outstanding = await this.derivedMoney.getOutstandingForCycle(cycle.id);
    const balance = await this.derivedMoney.getCreditBalanceForStudent(studentId);
    const offsetAmount = Math.min(outstanding, balance);
    if (offsetAmount <= 0) {
      throw new BadRequestException("Không có công nợ hoặc không đủ credit để bù trừ");
    }

    await this.repo.createLedgerEntries([
      {
        type: "CREDIT_OFFSET",
        amount: offsetAmount,
        studentId,
        billingCycleId: cycle.id,
        createdById: actorId,
        note: dto.note ?? "Bù trừ credit vào công nợ",
      },
    ]);

    await this.auditLogs.log({
      userId: actorId,
      action: "CREATE",
      entity: "CreditOffset",
      entityId: cycle.id,
      metadata: { after: { offsetAmount } },
    });

    // Activation of a now-settled PENDING cycle is left to the enrollment
    // read-path self-heal (F2 — "Evidence heals state").
    return {
      billingCycleId: cycle.id,
      studentId,
      offsetAmount,
      outstanding: await this.derivedMoney.getOutstandingForCycle(cycle.id),
      creditBalance: await this.derivedMoney.getCreditBalanceForStudent(studentId),
    };
  }

  /** Refund a credit grant: a REFUND row draws the balance down, then the grant
   * is flagged REFUNDED. Order matters — the REFUND row lands first, so the
   * balance guard blocks any retry/double-refund (money-out can never double). */
  async refund(grantId: string, dto: RefundCreditDto, actorId: string) {
    const grant = await this.repo.findLedgerById(grantId);
    if (!grant || grant.type !== "CREDIT_GRANT") {
      throw new NotFoundException("Không tìm thấy khoản credit");
    }
    if (grant.refundStatus === "REFUNDED") {
      throw new ConflictException("Khoản credit này đã được hoàn");
    }
    const amount = grant.amount.toNumber();
    const balance = await this.derivedMoney.getCreditBalanceForStudent(grant.studentId);
    if (balance < amount) {
      throw new BadRequestException("Credit đã được sử dụng, không đủ số dư để hoàn");
    }

    // REFUND row first (money-out accounted): a retry now fails the balance guard.
    await this.repo.createLedgerEntries([
      {
        type: "REFUND",
        amount,
        studentId: grant.studentId,
        billingCycleId: grant.billingCycleId,
        createdById: actorId,
        note: dto.note ?? "Hoàn credit",
      },
    ]);
    await this.repo.updateLedgerRefundStatus(grantId, "REFUNDED");

    await this.auditLogs.log({
      userId: actorId,
      action: "UPDATE",
      entity: "CreditRefund",
      entityId: grantId,
      metadata: { status: { from: "NOT_REFUNDED", to: "REFUNDED" }, after: { refunded: amount } },
    });

    return {
      creditGrantId: grantId,
      studentId: grant.studentId,
      refunded: amount,
      creditBalance: await this.derivedMoney.getCreditBalanceForStudent(grant.studentId),
    };
  }

  /** List credit grants (+ the student's current derived balance). */
  async findAll(query: CreditQueryDto) {
    const { studentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where = {
      type: "CREDIT_GRANT" as const,
      deletedAt: null,
      ...(studentId && { studentId }),
    };
    const [items, total] = await Promise.all([
      this.repo.findCredits({ where, skip, take: limit }),
      this.repo.countLedger(where),
    ]);
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
