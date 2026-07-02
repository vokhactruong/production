import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto, UserQueryDto } from "./dto/user.dto";
import * as bcrypt from "bcrypt";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: {
      role: { select: { id: true, name: true, isSystem: true } },
    },
  },
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService
  ) {}

  async findAll(query: UserQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(this.formatUser),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException("Người dùng không tồn tại");
    return this.formatUser(user);
  }

  async create(dto: CreateUserDto, actorId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) throw new ConflictException("Email đã được sử dụng");

    const hash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: dto.status ?? "ACTIVE",
        },
      });

      if (dto.roleIds?.length) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: newUser.id, roleId })),
        });
      }

      return newUser;
    });

    await this.auditLogs.log({
      userId: actorId,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
    });
    return this.findOne(user.id);
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
          ...(dto.avatar !== undefined && { avatar: dto.avatar }),
          ...(dto.status && { status: dto.status }),
        },
      });

      if (dto.roleIds !== undefined) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (dto.roleIds.length) {
          await tx.userRole.createMany({
            data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
          });
        }
      }
    });

    await this.auditLogs.log({ userId: actorId, action: "UPDATE", entity: "User", entityId: id });
    return this.findOne(id);
  }

  async remove(id: string, actorId?: string) {
    if (id === actorId) throw new BadRequestException("Không thể xóa chính mình");

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new NotFoundException("Người dùng không tồn tại");

      const linkedEmployee = await tx.employee.findFirst({
        where: { userId: id, deletedAt: null },
      });
      if (linkedEmployee) {
        throw new BadRequestException(
          "Không thể xóa tài khoản đang liên kết với nhân viên. Vui lòng hủy liên kết trước."
        );
      }

      await tx.user.update({ where: { id }, data: { deletedAt: new Date() } });
      await this.auditLogs.log(
        { userId: actorId, action: "DELETE", entity: "User", entityId: id },
        tx
      );
    });

    return { message: "Xóa người dùng thành công" };
  }

  async getStats() {
    const [total, teachers, students, parents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { userRoles: { some: { role: { name: "Teacher" } } } } }),
      this.prisma.user.count({ where: { userRoles: { some: { role: { name: "Student" } } } } }),
      this.prisma.user.count({ where: { userRoles: { some: { role: { name: "Parent" } } } } }),
    ]);
    const admins = await this.prisma.user.count({
      where: { userRoles: { some: { role: { name: { in: ["Admin", "Super Admin"] } } } } },
    });
    return { total, teachers, students, parents, admins };
  }

  private formatUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userRoles: { role: { id: string; name: string; isSystem: boolean } }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((ur) => ur.role),
    };
  }
}
