import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ClassesRepository } from "./classes.repository";
import { CreateClassDto, UpdateClassDto, ClassQueryDto } from "./dto/class.dto";

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classesRepository: ClassesRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  private assertDateRange(startDate: string, endDate: string) {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
    }
  }

  private async assertActiveCourse(courseId: string, tx?: Prisma.TransactionClient) {
    const course = await (tx ?? this.prisma).course.findFirst({
      where: { id: courseId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (!course) throw new BadRequestException("Khóa học không tồn tại hoặc không hoạt động");
  }

  private async assertActiveSubject(subjectId: string, tx?: Prisma.TransactionClient) {
    const subject = await (tx ?? this.prisma).subject.findFirst({
      where: { id: subjectId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (!subject) throw new BadRequestException("Môn học không tồn tại hoặc không hoạt động");
  }

  private async assertActiveClassroom(classroomId: string, tx?: Prisma.TransactionClient) {
    const classroom = await (tx ?? this.prisma).classroom.findFirst({
      where: { id: classroomId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!classroom) throw new BadRequestException("Phòng học không tồn tại hoặc không hoạt động");
  }

  private async assertActiveEmployee(employeeId: string, tx?: Prisma.TransactionClient) {
    const employee = await (tx ?? this.prisma).employee.findFirst({
      where: { id: employeeId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (!employee) throw new BadRequestException("Giáo viên không tồn tại hoặc không hoạt động");
  }

  private buildSearchConditions(search: string): Prisma.ClassWhereInput[] {
    const mode = "insensitive" as const;
    return [{ code: { contains: search, mode } }, { name: { contains: search, mode } }];
  }

  async findAll(query: ClassQueryDto) {
    const {
      search,
      status,
      courseId,
      subjectId,
      classroomId,
      employeeId,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClassWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(courseId && { courseId }),
      ...(subjectId && { subjectId }),
      ...(classroomId && { classroomId }),
      ...(employeeId && { employeeId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && { OR: this.buildSearchConditions(search) }),
    };

    const [items, total] = await Promise.all([
      this.classesRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.classesRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const classEntity = await this.classesRepository.findById(id);
    if (!classEntity) throw new NotFoundException("Lớp học không tồn tại");
    return classEntity;
  }

  async create(dto: CreateClassDto, actorId?: string) {
    this.assertDateRange(dto.startDate, dto.endDate);

    const existing = await this.classesRepository.findByCode(dto.code);
    if (existing) throw new ConflictException("Mã lớp học đã được sử dụng");

    await Promise.all([
      this.assertActiveCourse(dto.courseId),
      this.assertActiveSubject(dto.subjectId),
      this.assertActiveClassroom(dto.classroomId),
      this.assertActiveEmployee(dto.employeeId),
    ]);

    // No $transaction here: this is a single-entity create (see DATABASE.md,
    // "Never use transactions for simple CRUD"). Prisma interactive
    // transactions are also unreliable over this app's pooled DATABASE_URL
    // (pgbouncer transaction-pooling mode can recycle the underlying
    // connection between statements), which previously surfaced as
    // "Transaction not found" errors under real-world latency.
    const created = await this.classesRepository.create({
      code: dto.code,
      name: dto.name,
      course: { connect: { id: dto.courseId } },
      subject: { connect: { id: dto.subjectId } },
      classroom: { connect: { id: dto.classroomId } },
      employee: { connect: { id: dto.employeeId } },
      status: dto.status ?? "PLANNING",
      capacity: dto.capacity,
      sessionCount: dto.sessionCount ?? 15,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      description: dto.description,
      isActive: dto.isActive ?? true,
    });
    await this.auditLogs.log({
      userId: actorId,
      action: "CREATE",
      entity: "Class",
      entityId: created.id,
    });

    return created;
  }

  async update(id: string, dto: UpdateClassDto, actorId?: string) {
    const existing = await this.classesRepository.findById(id);
    if (!existing) throw new NotFoundException("Lớp học không tồn tại");

    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      this.assertDateRange(
        dto.startDate ?? existing.startDate.toISOString(),
        dto.endDate ?? existing.endDate.toISOString()
      );
    }

    await Promise.all([
      dto.courseId !== undefined ? this.assertActiveCourse(dto.courseId) : Promise.resolve(),
      dto.subjectId !== undefined ? this.assertActiveSubject(dto.subjectId) : Promise.resolve(),
      dto.classroomId !== undefined
        ? this.assertActiveClassroom(dto.classroomId)
        : Promise.resolve(),
      dto.employeeId !== undefined ? this.assertActiveEmployee(dto.employeeId) : Promise.resolve(),
    ]);

    // No $transaction here — see the comment in create() above.
    const updated = await this.classesRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.courseId !== undefined && { course: { connect: { id: dto.courseId } } }),
      ...(dto.subjectId !== undefined && { subject: { connect: { id: dto.subjectId } } }),
      ...(dto.classroomId !== undefined && {
        classroom: { connect: { id: dto.classroomId } },
      }),
      ...(dto.employeeId !== undefined && { employee: { connect: { id: dto.employeeId } } }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      ...(dto.sessionCount !== undefined && { sessionCount: dto.sessionCount }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    await this.auditLogs.log({ userId: actorId, action: "UPDATE", entity: "Class", entityId: id });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const existing = await this.classesRepository.findById(id);
    if (!existing) throw new NotFoundException("Lớp học không tồn tại");

    // No $transaction here — see the comment in create() above.
    await this.classesRepository.softDelete(id);
    await this.auditLogs.log({ userId: actorId, action: "DELETE", entity: "Class", entityId: id });

    return { message: "Xóa lớp học thành công" };
  }
}
