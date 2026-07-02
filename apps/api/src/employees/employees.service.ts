import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
  LinkUserDto,
  CreateUserAccountDto,
} from "./dto/employee.dto";
import { EmployeesRepository, EmployeeRecord } from "./employees.repository";

type EmployeeUser = {
  id: string;
  email: string;
  status: string;
  roles: Array<{ id: string; name: string }>;
};

type FormattedEmployee = Omit<EmployeeRecord, "user"> & {
  user: EmployeeUser | null;
};

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditLogs: AuditLogsService
  ) {}

  private formatEmployee(record: EmployeeRecord): FormattedEmployee {
    const { user, ...rest } = record;
    return {
      ...rest,
      user: user
        ? {
            id: user.id,
            email: user.email,
            status: user.status,
            roles: user.userRoles.map((ur) => ur.role),
          }
        : null,
    };
  }

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
      items: items.map((e) => this.formatEmployee(e)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const employee = await this.employeesRepository.findById(id);
    if (!employee) throw new NotFoundException("Nhân viên không tồn tại");
    return this.formatEmployee(employee);
  }

  async findAvailableUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        employee: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { lastName: "asc" },
    });
    return users;
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

        return this.formatEmployee(employee);
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

    return this.formatEmployee(employee);
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.employeesRepository.findById(id, tx);
      if (!existing) throw new NotFoundException("Nhân viên không tồn tại");

      if (existing.userId) {
        throw new BadRequestException(
          "Không thể xóa nhân viên đang có tài khoản đăng nhập. Vui lòng hủy liên kết tài khoản trước."
        );
      }

      await this.employeesRepository.softDelete(id, tx);
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "Employee", entityId: id },
        tx
      );
    });

    return { message: "Xóa nhân viên thành công" };
  }

  async linkUser(employeeId: string, dto: LinkUserDto, actorId?: string) {
    const employee = await this.prisma.$transaction(async (tx) => {
      const existing = await this.employeesRepository.findById(employeeId, tx);
      if (!existing) throw new NotFoundException("Nhân viên không tồn tại");

      if (existing.userId) {
        throw new ConflictException(
          "Nhân viên này đã có tài khoản đăng nhập. Vui lòng hủy liên kết trước."
        );
      }

      const user = await tx.user.findFirst({
        where: { id: dto.userId, deletedAt: null, status: "ACTIVE" },
      });
      if (!user) throw new NotFoundException("Tài khoản không tồn tại hoặc không hoạt động");

      const alreadyLinked = await this.employeesRepository.findByUserId(dto.userId);
      if (alreadyLinked && alreadyLinked.id !== employeeId) {
        throw new ConflictException("Tài khoản này đã được liên kết với nhân viên khác");
      }

      const updated = await this.employeesRepository.update(
        employeeId,
        { user: { connect: { id: dto.userId } } },
        tx
      );

      await this.auditLogs.log(
        {
          userId: actorId,
          action: "UPDATE",
          entity: "Employee",
          entityId: employeeId,
          metadata: { action: "LINK_USER", linkedUserId: dto.userId },
        },
        tx
      );

      return updated;
    });

    return this.formatEmployee(employee);
  }

  async unlinkUser(employeeId: string, actorId?: string) {
    const employee = await this.prisma.$transaction(async (tx) => {
      const existing = await this.employeesRepository.findById(employeeId, tx);
      if (!existing) throw new NotFoundException("Nhân viên không tồn tại");

      if (!existing.userId) {
        throw new BadRequestException("Nhân viên này chưa có tài khoản đăng nhập");
      }

      const unlinkedUserId = existing.userId;

      const updated = await this.employeesRepository.update(
        employeeId,
        { user: { disconnect: true } },
        tx
      );

      await this.auditLogs.log(
        {
          userId: actorId,
          action: "UPDATE",
          entity: "Employee",
          entityId: employeeId,
          metadata: { action: "UNLINK_USER", unlinkedUserId },
        },
        tx
      );

      return updated;
    });

    return this.formatEmployee(employee);
  }

  async createUserAndLink(employeeId: string, dto: CreateUserAccountDto, actorId?: string) {
    // Hash before opening the transaction — bcrypt is CPU-intensive and would cause
    // Prisma's interactive transaction to time out if run inside it.
    const hash = await bcrypt.hash(dto.password, 12);

    const employee = await this.prisma.$transaction(async (tx) => {
      const existing = await this.employeesRepository.findById(employeeId, tx);
      if (!existing) throw new NotFoundException("Nhân viên không tồn tại");

      if (existing.userId) {
        throw new ConflictException(
          "Nhân viên này đã có tài khoản đăng nhập. Vui lòng hủy liên kết trước."
        );
      }

      const emailTaken = await tx.user.findFirst({
        where: { email: dto.email, deletedAt: null },
      });
      if (emailTaken) throw new ConflictException("Email đã được sử dụng bởi tài khoản khác");

      const role = await tx.role.findUnique({ where: { id: dto.roleId } });
      if (!role) throw new NotFoundException("Vai trò không tồn tại");

      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hash,
          firstName: existing.firstName,
          lastName: existing.lastName,
          status: "ACTIVE",
          userRoles: { create: { roleId: dto.roleId } },
        },
      });

      await this.auditLogs.log(
        { userId: actorId, action: "CREATE", entity: "User", entityId: newUser.id },
        tx
      );

      const updated = await this.employeesRepository.update(
        employeeId,
        { user: { connect: { id: newUser.id } } },
        tx
      );

      await this.auditLogs.log(
        {
          userId: actorId,
          action: "UPDATE",
          entity: "Employee",
          entityId: employeeId,
          metadata: { action: "LINK_USER", linkedUserId: newUser.id },
        },
        tx
      );

      return updated;
    });

    return this.formatEmployee(employee);
  }
}
