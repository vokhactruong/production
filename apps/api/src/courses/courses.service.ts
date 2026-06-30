import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CoursesRepository } from "./courses.repository";
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from "./dto/course.dto";

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesRepository: CoursesRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  async findAll(query: CourseQueryDto) {
    const {
      search,
      subjectId,
      status,
      sortBy = "displayOrder",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const mode = "insensitive" as const;
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(subjectId && { subjectId }),
      ...(search && {
        OR: [
          { code: { contains: search, mode } },
          { name: { contains: search, mode } },
          { description: { contains: search, mode } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.coursesRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.coursesRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const course = await this.coursesRepository.findById(id);
    if (!course) throw new NotFoundException("Khóa học không tồn tại");
    return course;
  }

  async create(dto: CreateCourseDto, actorId?: string) {
    const existing = await this.coursesRepository.findByCode(dto.code);
    if (existing) throw new ConflictException("Mã khóa học đã được sử dụng");

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, deletedAt: null },
      select: { id: true },
    });
    if (!subject) throw new NotFoundException("Môn học không tồn tại");

    const course = await this.prisma.$transaction(async (tx) => {
      const created = await this.coursesRepository.create(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          courseType: dto.courseType ?? "NORMAL",
          packageLessons: dto.packageLessons,
          lessonDuration: dto.lessonDuration,
          basePrice: dto.basePrice,
          displayOrder: dto.displayOrder ?? 0,
          status: dto.status ?? "ACTIVE",
          subject: { connect: { id: dto.subjectId } },
        },
        tx
      );
      await this.auditLogs.log(
        { userId: actorId, action: "CREATE", entity: "Course", entityId: created.id },
        tx
      );
      return created;
    });

    return course;
  }

  async update(id: string, dto: UpdateCourseDto, actorId?: string) {
    const course = await this.prisma.$transaction(async (tx) => {
      const existing = await this.coursesRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Khóa học không tồn tại");

      const updated = await this.coursesRepository.update(
        id,
        {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.courseType !== undefined && { courseType: dto.courseType }),
          ...(dto.packageLessons !== undefined && { packageLessons: dto.packageLessons }),
          ...(dto.lessonDuration !== undefined && { lessonDuration: dto.lessonDuration }),
          ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
          ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
        tx
      );

      await this.auditLogs.log(
        { userId: actorId, action: "UPDATE", entity: "Course", entityId: id },
        tx
      );

      return updated;
    });

    return course;
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.coursesRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Khóa học không tồn tại");

      await this.coursesRepository.softDelete(id, tx);
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "Course", entityId: id },
        tx
      );
    });

    return { message: "Xóa khóa học thành công" };
  }
}
