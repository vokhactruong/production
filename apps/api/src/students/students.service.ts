import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateStudentDto, StudentQueryDto, UpdateStudentDto } from "./dto/student.dto";
import { StudentsRepository } from "./students.repository";

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentsRepository: StudentsRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  private buildSearchConditions(search: string): Prisma.StudentWhereInput[] {
    const mode = "insensitive" as const;
    const conditions: Prisma.StudentWhereInput[] = [
      { code: { contains: search, mode } },
      { firstName: { contains: search, mode } },
      { lastName: { contains: search, mode } },
      { email: { contains: search, mode } },
      { phone: { contains: search, mode } },
      { guardianName: { contains: search, mode } },
      { guardianPhone: { contains: search, mode } },
    ];

    // "Nguyen An" → match firstName contains "Nguyen" AND lastName contains "An"
    const parts = search.trim().split(/\s+/);
    if (parts.length >= 2) {
      conditions.push({
        AND: [
          { firstName: { contains: parts[0], mode } },
          { lastName: { contains: parts.slice(1).join(" "), mode } },
        ],
      });
    }

    return conditions;
  }

  async findAll(query: StudentQueryDto) {
    const {
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(search && { OR: this.buildSearchConditions(search) }),
    };

    const [items, total] = await Promise.all([
      this.studentsRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.studentsRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const student = await this.studentsRepository.findById(id);
    if (!student) throw new NotFoundException("Học sinh không tồn tại");
    return student;
  }

  private async generateCode(): Promise<string> {
    const last = await this.prisma.student.findFirst({
      where: { code: { not: null } },
      select: { code: true },
      orderBy: { createdAt: "desc" },
    });
    const lastNum = last?.code ? parseInt(last.code.replace("HS-", ""), 10) : 0;
    const next = isNaN(lastNum) ? 1 : lastNum + 1;
    return `HS-${String(next).padStart(3, "0")}`;
  }

  async create(dto: CreateStudentDto, actorId?: string) {
    if (dto.email) {
      const existing = await this.studentsRepository.findByEmail(dto.email);
      if (existing) throw new ConflictException("Email đã được sử dụng");
    }

    if (dto.phone) {
      const existing = await this.studentsRepository.findByPhone(dto.phone);
      if (existing) throw new ConflictException("Số điện thoại đã được sử dụng");
    }

    const data: Prisma.StudentCreateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      guardianName: dto.guardianName,
      guardianPhone: dto.guardianPhone,
      guardianEmail: dto.guardianEmail,
      status: dto.status,
      notes: dto.notes,
    };

    const MAX_RETRIES = 5;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const code = await this.generateCode();

        const student = await this.prisma.$transaction(async (tx) => {
          const created = await this.studentsRepository.create({ ...data, code }, tx);
          await this.auditLogs.log(
            { userId: actorId, action: "CREATE", entity: "Student", entityId: created.id },
            tx
          );
          return created;
        });

        return student;
      } catch (err) {
        const isCodeConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          Array.isArray(err.meta?.target) &&
          (err.meta.target as string[]).includes("code");

        if (isCodeConflict && attempt < MAX_RETRIES) continue;
        if (isCodeConflict)
          throw new InternalServerErrorException("Không thể tạo mã học sinh. Vui lòng thử lại.");
        throw err;
      }
    }

    throw new InternalServerErrorException("Không thể tạo mã học sinh. Vui lòng thử lại.");
  }

  async update(id: string, dto: UpdateStudentDto, actorId?: string) {
    if (dto.email) {
      const existing = await this.studentsRepository.findByEmail(dto.email, id);
      if (existing) throw new ConflictException("Email đã được sử dụng");
    }

    if (dto.phone) {
      const existing = await this.studentsRepository.findByPhone(dto.phone, id);
      if (existing) throw new ConflictException("Số điện thoại đã được sử dụng");
    }

    const student = await this.prisma.$transaction(async (tx) => {
      const existing = await this.studentsRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Học sinh không tồn tại");

      const updated = await this.studentsRepository.update(
        id,
        {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.dateOfBirth !== undefined && {
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          }),
          ...(dto.gender !== undefined && { gender: dto.gender }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.avatar !== undefined && { avatar: dto.avatar }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.guardianName !== undefined && { guardianName: dto.guardianName }),
          ...(dto.guardianPhone !== undefined && { guardianPhone: dto.guardianPhone }),
          ...(dto.guardianEmail !== undefined && { guardianEmail: dto.guardianEmail }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        tx
      );

      await this.auditLogs.log(
        { userId: actorId, action: "UPDATE", entity: "Student", entityId: id },
        tx
      );

      return updated;
    });

    return student;
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.studentsRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Học sinh không tồn tại");

      await this.studentsRepository.softDelete(id, tx);
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "Student", entityId: id },
        tx
      );
    });

    return { message: "Xóa học sinh thành công" };
  }
}
