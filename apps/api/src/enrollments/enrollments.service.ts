import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { LessonConsumptionService } from "../attendance/lesson-consumption.service";
import { EnrollmentsRepository, EnrollmentRecord } from "./enrollments.repository";
import { CreateEnrollmentDto, UpdateEnrollmentDto, EnrollmentQueryDto } from "./dto/enrollment.dto";

type EligibleClass = {
  id: string;
  capacity: number;
  sessionCount: number;
  startDate: Date;
  endDate: Date;
};

const DUPLICATE_ACTIVE_MESSAGE = "Học sinh đã có một đăng ký đang hoạt động cho lớp học này";

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly auditLogs: AuditLogsService,
    private readonly lessonConsumption: LessonConsumptionService
  ) {}

  /**
   * Additive derived-balance fields (consumed/remaining) on enrollment reads.
   * Derived Balance is Source of Truth: no counter column exists anywhere —
   * callers must batch ALL visible enrollmentIds into ONE grouped COUNT via
   * LessonConsumptionService (never a COUNT per row).
   */
  private async withDerivedBalance(items: EnrollmentRecord[]) {
    const consumedByEnrollment = await this.lessonConsumption.getConsumedByEnrollmentIds(
      items.map((item) => item.id)
    );
    return items.map((item) => {
      const consumed = consumedByEnrollment.get(item.id) ?? 0;
      return { ...item, consumed, remaining: this.lessonConsumption.remainingFor(item, consumed) };
    });
  }

  private async assertActiveStudent(studentId: string, tx?: Prisma.TransactionClient) {
    const student = await (tx ?? this.prisma).student.findFirst({
      where: { id: studentId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (!student) throw new BadRequestException("Học sinh không tồn tại hoặc không hoạt động");
  }

  private async getEligibleClass(
    classId: string,
    tx?: Prisma.TransactionClient
  ): Promise<EligibleClass> {
    const classEntity = await (tx ?? this.prisma).class.findFirst({
      where: { id: classId, deletedAt: null },
      select: {
        id: true,
        isActive: true,
        status: true,
        capacity: true,
        sessionCount: true,
        startDate: true,
        endDate: true,
      },
    });
    if (!classEntity) throw new BadRequestException("Lớp học không tồn tại");
    if (!classEntity.isActive) throw new BadRequestException("Lớp học không hoạt động");
    if (classEntity.status === "COMPLETED") {
      throw new BadRequestException("Lớp học đã hoàn thành, không thể đăng ký");
    }
    if (classEntity.status === "CANCELLED") {
      throw new BadRequestException("Lớp học đã hủy, không thể đăng ký");
    }
    return classEntity;
  }

  private assertJoinedAtWithinClassPeriod(joinedAt: string, classEntity: EligibleClass) {
    const joined = new Date(joinedAt);
    if (joined < classEntity.startDate) {
      throw new BadRequestException("Ngày tham gia phải sau hoặc bằng ngày bắt đầu lớp học");
    }
    if (joined > classEntity.endDate) {
      throw new BadRequestException("Ngày tham gia phải trước hoặc bằng ngày kết thúc lớp học");
    }
  }

  private async assertNoDuplicateActive(studentId: string, classId: string, excludeId?: string) {
    const existing = await this.enrollmentsRepository.findActiveForStudentAndClass(
      studentId,
      classId,
      excludeId
    );
    if (existing) throw new ConflictException(DUPLICATE_ACTIVE_MESSAGE);
  }

  private async assertCapacity(classId: string, classEntity: EligibleClass, excludeId?: string) {
    const activeCount = await this.enrollmentsRepository.countActive(classId, excludeId);
    if (activeCount >= classEntity.capacity) {
      throw new ConflictException("Lớp học đã đủ số lượng học viên tối đa");
    }
  }

  private buildSearchConditions(search: string): Prisma.EnrollmentWhereInput[] {
    const mode = "insensitive" as const;
    return [
      { note: { contains: search, mode } },
      { student: { is: { firstName: { contains: search, mode } } } },
      { student: { is: { lastName: { contains: search, mode } } } },
      { student: { is: { code: { contains: search, mode } } } },
      { class: { is: { name: { contains: search, mode } } } },
      { class: { is: { code: { contains: search, mode } } } },
    ];
  }

  async findAll(query: EnrollmentQueryDto) {
    const {
      search,
      studentId,
      classId,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      deletedAt: null,
      ...(studentId && { studentId }),
      ...(classId && { classId }),
      ...(status && { status }),
      ...(search && { OR: this.buildSearchConditions(search) }),
    };

    const [items, total] = await Promise.all([
      this.enrollmentsRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.enrollmentsRepository.count(where),
    ]);

    return {
      items: await this.withDerivedBalance(items),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const enrollment = await this.enrollmentsRepository.findById(id);
    if (!enrollment) throw new NotFoundException("Đăng ký học không tồn tại");
    const [withBalance] = await this.withDerivedBalance([enrollment]);
    return withBalance;
  }

  async create(dto: CreateEnrollmentDto, actorId?: string) {
    await this.assertActiveStudent(dto.studentId);
    const classEntity = await this.getEligibleClass(dto.classId);
    this.assertJoinedAtWithinClassPeriod(dto.joinedAt, classEntity);

    const status = dto.status ?? "ACTIVE";
    if (status === "ACTIVE") {
      await this.assertNoDuplicateActive(dto.studentId, dto.classId);
      await this.assertCapacity(dto.classId, classEntity);
    }

    try {
      const enrollment = await this.prisma.$transaction(async (tx) => {
        const created = await this.enrollmentsRepository.create(
          {
            student: { connect: { id: dto.studentId } },
            class: { connect: { id: dto.classId } },
            status,
            joinedAt: new Date(dto.joinedAt),
            billingCycleSessions: classEntity.sessionCount,
            note: dto.note,
          },
          tx
        );
        await this.auditLogs.log(
          { userId: actorId, action: "CREATE", entity: "Enrollment", entityId: created.id },
          tx
        );
        return created;
      });

      return enrollment;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(DUPLICATE_ACTIVE_MESSAGE);
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateEnrollmentDto, actorId?: string) {
    const existing = await this.enrollmentsRepository.findById(id);
    if (!existing) throw new NotFoundException("Đăng ký học không tồn tại");

    const nextClassId = dto.classId ?? existing.classId;
    const nextStatus = dto.status ?? existing.status;
    const nextJoinedAt = dto.joinedAt ?? existing.joinedAt.toISOString();
    const classChanged = dto.classId !== undefined && dto.classId !== existing.classId;

    let classEntity: EligibleClass | null = null;
    if (classChanged || dto.joinedAt !== undefined) {
      classEntity = await this.getEligibleClass(nextClassId);
      this.assertJoinedAtWithinClassPeriod(nextJoinedAt, classEntity);
    }

    if (nextStatus === "ACTIVE" && (classChanged || dto.status !== undefined)) {
      if (!classEntity) classEntity = await this.getEligibleClass(nextClassId);
      await this.assertNoDuplicateActive(existing.studentId, nextClassId, id);
      await this.assertCapacity(nextClassId, classEntity, id);
    }

    try {
      const enrollment = await this.prisma.$transaction(async (tx) => {
        const current = await this.enrollmentsRepository.findById(id, tx);
        if (!current) throw new NotFoundException("Đăng ký học không tồn tại");

        const updated = await this.enrollmentsRepository.update(
          id,
          {
            ...(dto.classId !== undefined && { class: { connect: { id: dto.classId } } }),
            ...(dto.status !== undefined && { status: dto.status }),
            ...(dto.joinedAt !== undefined && { joinedAt: new Date(dto.joinedAt) }),
            ...(dto.note !== undefined && { note: dto.note }),
          },
          tx
        );

        const metadata: Record<string, { from: string; to: string }> = {};
        if (dto.classId !== undefined && dto.classId !== current.classId) {
          metadata.classId = { from: current.classId, to: dto.classId };
        }
        if (dto.status !== undefined && dto.status !== current.status) {
          metadata.status = { from: current.status, to: dto.status };
        }
        if (dto.joinedAt !== undefined) {
          const oldIso = current.joinedAt.toISOString();
          const newIso = new Date(dto.joinedAt).toISOString();
          if (newIso !== oldIso) metadata.joinedAt = { from: oldIso, to: newIso };
        }

        await this.auditLogs.log(
          {
            userId: actorId,
            action: "UPDATE",
            entity: "Enrollment",
            entityId: id,
            ...(Object.keys(metadata).length > 0 && { metadata }),
          },
          tx
        );

        return updated;
      });

      return enrollment;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(DUPLICATE_ACTIVE_MESSAGE);
      }
      throw err;
    }
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.enrollmentsRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Đăng ký học không tồn tại");

      if (existing.status === "ACTIVE") {
        throw new ConflictException(
          "Không thể xóa đăng ký đang hoạt động. Vui lòng chuyển trạng thái sang Tạm dừng hoặc Đã hủy trước."
        );
      }

      await this.enrollmentsRepository.softDelete(id, tx);
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "Enrollment", entityId: id },
        tx
      );
    });

    return { message: "Xóa đăng ký học thành công" };
  }
}
