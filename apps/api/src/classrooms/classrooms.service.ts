import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ClassroomsRepository } from "./classrooms.repository";
import { CreateClassroomDto, UpdateClassroomDto, ClassroomQueryDto } from "./dto/classroom.dto";

@Injectable()
export class ClassroomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classroomsRepository: ClassroomsRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  async findAll(query: ClassroomQueryDto) {
    const {
      search,
      type,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const mode = "insensitive" as const;
    const where: Prisma.ClassroomWhereInput = {
      deletedAt: null,
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [{ code: { contains: search, mode } }, { name: { contains: search, mode } }],
      }),
    };

    const [items, total] = await Promise.all([
      this.classroomsRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.classroomsRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const classroom = await this.classroomsRepository.findById(id);
    if (!classroom) throw new NotFoundException("Phòng học không tồn tại");
    return classroom;
  }

  async create(dto: CreateClassroomDto, actorId?: string) {
    const existing = await this.classroomsRepository.findByCode(dto.code);
    if (existing) throw new ConflictException("Mã phòng học đã được sử dụng");

    const classroom = await this.prisma.$transaction(async (tx) => {
      const created = await this.classroomsRepository.create(
        {
          code: dto.code,
          name: dto.name,
          type: dto.type,
          capacity: dto.capacity,
          description: dto.description,
          isActive: dto.isActive ?? true,
        },
        tx
      );
      await this.auditLogs.log(
        { userId: actorId, action: "CREATE", entity: "Classroom", entityId: created.id },
        tx
      );
      return created;
    });

    return classroom;
  }

  async update(id: string, dto: UpdateClassroomDto, actorId?: string) {
    const classroom = await this.prisma.$transaction(async (tx) => {
      const existing = await this.classroomsRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Phòng học không tồn tại");

      const updated = await this.classroomsRepository.update(
        id,
        {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.capacity !== undefined && { capacity: dto.capacity }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
        tx
      );

      await this.auditLogs.log(
        { userId: actorId, action: "UPDATE", entity: "Classroom", entityId: id },
        tx
      );

      return updated;
    });

    return classroom;
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.classroomsRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Phòng học không tồn tại");

      await this.classroomsRepository.softDelete(id, tx);
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "Classroom", entityId: id },
        tx
      );
    });

    return { message: "Xóa phòng học thành công" };
  }
}
