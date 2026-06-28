import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

interface LogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogParams, tx?: Tx) {
    await (tx ?? this.prisma).auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        ipAddress: params.ipAddress,
        metadata: params.metadata,
      },
    });
  }

  async findAll(query: { page?: number; limit?: number; entity?: string; entityId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.entity && { entity: query.entity }),
      ...(query.entityId && { entityId: query.entityId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
