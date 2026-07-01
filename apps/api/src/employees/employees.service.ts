import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateEmployeeDto, EmployeeQueryDto, UpdateEmployeeDto } from "./dto/employee.dto";
import { EmployeesRepository } from "./employees.repository";

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  private buildSearchConditions(search: string): Prisma.EmployeeWhereInput[] {
    const mode = "insensitive" as const;
    const conditions: Prisma.EmployeeWhereInput[] = [
      { code: { contains: search, mode } },
      { firstName: { contains: search, mode } },
      { lastName: { contains: search, mode } },
      { email: { contains: search, mode } },
      { phone: { contains: search, mode } },
    ];

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

  async findAll(query: EmployeeQueryDto) {
    const {
      search,
      employeeType,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(employeeType && { employeeType }),
      ...(search && { OR: this.buildSearchConditions(search) }),
    };

    const [items, total] = await Promise.all([
      this.employeesRepository.findAll({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.employeesRepository.count(where),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const employee = await this.employeesRepository.findById(id);
    if (!employee) throw new NotFoundException("Nhân viên không tồn tại");
    return employee;
  }

  private async generateCode(): Promise<string> {
    const lastCode = await this.employeesRepository.findLastCode();
    const lastNum = lastCode ? parseInt(lastCode.replace("NV-", ""), 10) : 0;
    const next = isNaN(lastNum) ? 1 : lastNum + 1;
    return `NV-${String(next).padStart(3, "0")}`;
  }

  async create(dto: CreateEmployeeDto, actorId?: string) {
    if (dto.email) {
      const existing = await this.employeesRepository.findByEmail(dto.email);
      if (existing) throw new ConflictException("Email đã được sử dụng");
    }

    if (dto.phone) {
      const existing = await this.employeesRepository.findByPhone(dto.phone);
      if (existing) throw new ConflictException("Số điện thoại đã được sử dụng");
    }

    const data: Prisma.EmployeeCreateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      address: dto.address,
      avatar: dto.avatar,
      employeeType: dto.employeeType,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      status: dto.status ?? "ACTIVE",
      notes: dto.notes,
      code: "",
    };

    const MAX_RETRIES = 5;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const code = await this.generateCode();

        const employee = await this.prisma.$transaction(async (tx) => {
          const created = await this.employeesRepository.create({ ...data, code }, tx);
          await this.auditLogs.log(
            { userId: actorId, action: "CREATE", entity: "Employee", entityId: created.id },
            tx
          );
          return created;
        });

        return employee;
      } catch (err) {
        const isCodeConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          Array.isArray(err.meta?.target) &&
          (err.meta.target as string[]).includes("code");

        if (isCodeConflict && attempt < MAX_RETRIES) continue;
        if (isCodeConflict)
          throw new InternalServerErrorException("Không thể tạo mã nhân viên. Vui lòng thử lại.");
        throw err;
      }
    }

    throw new InternalServerErrorException("Không thể tạo mã nhân viên. Vui lòng thử lại.");
  }

  async update(id: string, dto: UpdateEmployeeDto, actorId?: string) {
    if (dto.email) {
      const existing = await this.employeesRepository.findByEmail(dto.email, id);
      if (existing) throw new ConflictException("Email đã được sử dụng");
    }

    if (dto.phone) {
      const existing = await this.employeesRepository.findByPhone(dto.phone, id);
      if (existing) throw new ConflictException("Số điện thoại đã được sử dụng");
    }

    const employee = await this.prisma.$transaction(async (tx) => {
      const existing = await this.employeesRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Nhân viên không tồn tại");

      const updated = await this.employeesRepository.update(
        id,
        {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.gender !== undefined && { gender: dto.gender }),
          ...(dto.dateOfBirth !== undefined && {
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.avatar !== undefined && { avatar: dto.avatar }),
          ...(dto.employeeType !== undefined && { employeeType: dto.employeeType }),
          ...(dto.hireDate !== undefined && {
            hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        tx
      );

      await this.auditLogs.log(
        { userId: actorId, action: "UPDATE", entity: "Employee", entityId: id },
        tx
      );

      return updated;
    });

    return employee;
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.employeesRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Nhân viên không tồn tại");

      await this.employeesRepository.softDelete(id, tx);
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "Employee", entityId: id },
        tx
      );
    });

    return { message: "Xóa nhân viên thành công" };
  }
}
