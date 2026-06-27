import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from "./dto/role.dto";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

const ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { userRoles: true } },
  rolePermissions: {
    select: { permission: { select: { id: true, name: true, code: true, description: true } } },
  },
};

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService
  ) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      select: ROLE_SELECT,
      orderBy: { createdAt: "asc" },
    });
    return roles.map(this.formatRole);
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, select: ROLE_SELECT });
    if (!role) throw new NotFoundException("Vai trò không tồn tại");
    return this.formatRole(role);
  }

  async create(dto: CreateRoleDto, actorId?: string) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException("Tên vai trò đã tồn tại");

    const role = await this.prisma.role.create({
      data: { name: dto.name, description: dto.description },
      select: ROLE_SELECT,
    });
    await this.auditLogs.log({
      userId: actorId,
      action: "CREATE",
      entity: "Role",
      entityId: role.id,
    });
    return this.formatRole(role);
  }

  async update(id: string, dto: UpdateRoleDto, actorId?: string) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.role.findFirst({ where: { name: dto.name, NOT: { id } } });
      if (existing) throw new ConflictException("Tên vai trò đã tồn tại");
    }

    const role = await this.prisma.role.update({ where: { id }, data: dto, select: ROLE_SELECT });
    await this.auditLogs.log({ userId: actorId, action: "UPDATE", entity: "Role", entityId: id });
    return this.formatRole(role);
  }

  async remove(id: string, actorId?: string) {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException("Không thể xóa vai trò hệ thống");

    const userCount = await this.prisma.userRole.count({ where: { roleId: id } });
    if (userCount > 0) throw new BadRequestException("Vai trò đang được sử dụng bởi người dùng");

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.role.delete({ where: { id } });
    });

    await this.auditLogs.log({ userId: actorId, action: "DELETE", entity: "Role", entityId: id });
    return { message: "Xóa vai trò thành công" };
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto, actorId?: string) {
    await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      if (dto.permissionIds.length) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        });
      }
    });

    await this.auditLogs.log({
      userId: actorId,
      action: "ASSIGN_PERMISSIONS",
      entity: "Role",
      entityId: id,
    });
    return this.findOne(id);
  }

  private formatRole(role: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { userRoles: number };
    rolePermissions: {
      permission: { id: string; name: string; code: string; description: string | null };
    }[];
  }) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }
}
