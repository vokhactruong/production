import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { LessonConsumptionService } from "../attendance/lesson-consumption.service";
import { PaymentsRepository } from "./payments.repository";
import { DerivedMoneyService } from "./derived-money.service";
import { SellPackageDto, BillingCycleQueryDto } from "./dto/payment.dto";

const PENDING_CONFLICT = "Đăng ký học đã có một chu kỳ thanh toán đang chờ (PENDING)";

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PaymentsRepository,
    private readonly auditLogs: AuditLogsService,
    private readonly lessonConsumption: LessonConsumptionService,
    private readonly derivedMoney: DerivedMoneyService
  ) {}

  /**
   * Sell a package → creates a PENDING BillingCycle carrying the Time-frozen
   * Snapshot Price (D14) and writes the CHARGE ledger row that IS the debt
   * (Q1/Q2 → BI-1: debt is born only here). Pro-rata default is evidence-based —
   * remaining package lessons from Slice #1 consumption (OQ-A), never calendar.
   * PENDING → ACTIVE happens later, only via a settling payment (Q3).
   */
  async sell(dto: SellPackageDto, actorId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollmentId, deletedAt: null },
      select: {
        id: true,
        studentId: true,
        billingCycleSessions: true,
        student: { select: { status: true, deletedAt: true } },
        class: {
          select: { course: { select: { basePrice: true, packageLessons: true } } },
        },
      },
    });
    if (!enrollment) throw new NotFoundException("Đăng ký học không tồn tại");
    if (enrollment.student.deletedAt !== null || enrollment.student.status !== "ACTIVE") {
      throw new BadRequestException("Học sinh không hoạt động, không thể bán gói");
    }

    const packageLessons = enrollment.class.course.packageLessons;
    if (packageLessons <= 0) {
      throw new BadRequestException("Khóa học không có số buổi hợp lệ");
    }
    const basePrice = enrollment.class.course.basePrice.toNumber();

    // Pro-rata basis = remaining package lessons (evidence-based, OQ-A).
    const consumedMap = await this.lessonConsumption.getConsumedByEnrollmentIds([enrollment.id]);
    const consumed = consumedMap.get(enrollment.id) ?? 0;
    const defaultSessions = Math.max(1, packageLessons - consumed);
    const sessionsSold = dto.sessionsSold ?? defaultSessions;

    const proRataPrice = Math.round((basePrice * sessionsSold) / packageLessons);
    const price = dto.priceOverride ?? proRataPrice;
    const discount = dto.discount ?? 0;
    const snapshotPrice = price - discount;
    if (snapshotPrice < 0) {
      throw new BadRequestException("Giá sau chiết khấu không được âm");
    }

    let cycleId: string;
    try {
      const created = await this.repo.createCycle({
        enrollment: { connect: { id: enrollment.id } },
        status: "PENDING",
        snapshotPrice,
        snapshotDiscount: discount || null,
        sessionsSold,
        note: dto.note,
      });
      cycleId = created.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(PENDING_CONFLICT);
      }
      throw err;
    }

    // The CHARGE ledger row IS the debt (unified ledger, BI-1). Amount equals the
    // frozen snapshot price so the per-cycle ledger balances (BI-11).
    await this.repo.createLedgerEntries([
      {
        type: "CHARGE",
        amount: snapshotPrice,
        studentId: enrollment.studentId,
        billingCycleId: cycleId,
        createdById: actorId,
        note: "Bán gói (ghi nợ)",
      },
    ]);

    await this.auditLogs.log({
      userId: actorId,
      action: "CREATE",
      entity: "BillingCycle",
      entityId: cycleId,
      metadata: { after: { sessionsSold, snapshotPrice, discount } },
    });

    return this.findOne(cycleId);
  }

  async findOne(id: string) {
    const cycle = await this.repo.findCycleById(id);
    if (!cycle) throw new NotFoundException("Chu kỳ thanh toán không tồn tại");
    const outstanding = await this.derivedMoney.getOutstandingForCycle(id);
    return { ...cycle, outstanding };
  }

  /**
   * T2 lazy renewal + F2 self-heal — the ONE explicit code path where the
   * enrollment read side-effects billing state ("Evidence heals state"). Fully
   * idempotent: safe to call on every enrollment detail read; DB partial-uniques
   * (one ACTIVE, one PENDING) make concurrent readers converge, never duplicate.
   * Called by EnrollmentsService.findOne only — never from list reads.
   */
  async reconcile(enrollmentId: string): Promise<void> {
    const cycles = await this.repo.findLiveCyclesForEnrollment(enrollmentId);
    if (cycles.length === 0) return;
    const remaining = await this.derivedMoney.getCycleRemainingMap(enrollmentId);

    // 1. Complete a fully-consumed ACTIVE cycle.
    for (const c of cycles) {
      if (c.status === "ACTIVE" && (remaining.get(c.id) ?? c.sessionsSold) <= 0) {
        await this.repo.updateCycleStatus(c.id, "COMPLETED");
        c.status = "COMPLETED";
      }
    }

    // 2. Self-heal a fully-paid PENDING cycle → ACTIVE (only if none ACTIVE, D13).
    if (!cycles.some((c) => c.status === "ACTIVE")) {
      for (const c of cycles) {
        if (c.status === "PENDING" && (await this.derivedMoney.isCycleFullyPaid(c.id))) {
          try {
            await this.repo.updateCycleStatus(c.id, "ACTIVE");
            c.status = "ACTIVE";
            break;
          } catch (err) {
            if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"))
              throw err;
          }
        }
      }
    }

    // 3. Renewal: all cycles terminal AND sold capacity fully consumed AND the
    //    enrollment still ACTIVE → materialize the next PENDING cycle (Q3/BI-4).
    if (cycles.some((c) => c.status === "PENDING" || c.status === "ACTIVE")) return;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, deletedAt: null },
      select: {
        id: true,
        status: true,
        studentId: true,
        class: { select: { course: { select: { basePrice: true, packageLessons: true } } } },
      },
    });
    if (!enrollment || enrollment.status !== "ACTIVE") return;

    const totalCap = cycles.reduce((s, c) => s + c.sessionsSold, 0);
    const consumedMap = await this.lessonConsumption.getConsumedByEnrollmentIds([enrollmentId]);
    if ((consumedMap.get(enrollmentId) ?? 0) < totalCap) return; // capacity not exhausted

    const basePrice = enrollment.class.course.basePrice.toNumber();
    const packageLessons = enrollment.class.course.packageLessons;
    try {
      const created = await this.repo.createCycle({
        enrollment: { connect: { id: enrollmentId } },
        status: "PENDING",
        snapshotPrice: basePrice,
        snapshotDiscount: null,
        sessionsSold: packageLessons,
        note: "Gia hạn tự động",
      });
      await this.repo.createLedgerEntries([
        {
          type: "CHARGE",
          amount: basePrice,
          studentId: enrollment.studentId,
          billingCycleId: created.id,
          note: "Gia hạn tự động (ghi nợ)",
        },
      ]);
    } catch (err) {
      // one-PENDING partial-unique: another concurrent read already renewed.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }
  }

  async findAll(query: BillingCycleQueryDto) {
    const { enrollmentId, studentId, status, sortOrder = "desc", page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BillingCycleWhereInput = {
      deletedAt: null,
      ...(enrollmentId && { enrollmentId }),
      ...(status && { status }),
      ...(studentId && { enrollment: { is: { studentId } } }),
    };

    const [items, total] = await Promise.all([
      this.repo.findCycles({ where, orderBy: { createdAt: sortOrder }, skip, take: limit }),
      this.repo.countCycles(where),
    ]);

    const outstandingMap = await this.derivedMoney.getOutstandingByCycleIds(items.map((c) => c.id));
    return {
      items: items.map((c) => ({ ...c, outstanding: outstandingMap.get(c.id) ?? 0 })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
