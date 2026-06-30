import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateSubjectDto, UpdateSubjectDto, SubjectQueryDto } from "./dto/subject.dto";
import { SubjectsRepository } from "./subjects.repository";

@Injectable()
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subjectsRepository: SubjectsRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  async findAll(query: SubjectQueryDto) {
    const {
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const mode = "insensitive" as const;
    const where: Prisma.SubjectWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode } },
          { name: { contains: search, mode } },
          { description: { contains: search, mode } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.subjectsRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.subjectsRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const subject = await this.subjectsRepository.findById(id);
    if (!subject) throw new NotFoundException("Môn học không tồn tại");
    return subject;
  }

  async create(dto: CreateSubjectDto, actorId?: string) {
    const existing = await this.subjectsRepository.findByCode(dto.code);
    if (existing) throw new ConflictException("Mã môn học đã được sử dụng");

    const subject = await this.prisma.$transaction(async (tx) => {
      const created = await this.subjectsRepository.create(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          color: dto.color,
          icon: dto.icon,
          status: dto.status ?? "ACTIVE",
        },
        tx
      );
      await this.auditLogs.log(
        { userId: actorId, action: "CREATE", entity: "Subject", entityId: created.id },
        tx
      );
      return created;
    });

    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto, actorId?: string) {
    const subject = await this.prisma.$transaction(async (tx) => {
      const existing = await this.subjectsRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Môn học không tồn tại");

      const updated = await this.subjectsRepository.update(
        id,
        {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.color !== undefined && { color: dto.color }),
          ...(dto.icon !== undefined && { icon: dto.icon }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
        tx
      );

      await this.auditLogs.log(
        { userId: actorId, action: "UPDATE", entity: "Subject", entityId: id },
        tx
      );

      return updated;
    });

    return subject;
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.subjectsRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Môn học không tồn tại");

      await this.subjectsRepository.softDelete(id, tx);
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "Subject", entityId: id },
        tx
      );
    });

    return { message: "Xóa môn học thành công" };
  }
}
