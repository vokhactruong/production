import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "../auth/decorators/current-user.decorator";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(user: RequestUser) {
    const canUsers = user.permissions.includes("user.read");
    const canArticles =
      user.permissions.includes("article.read") ||
      user.permissions.includes("article.manage");
    const canRoles = user.permissions.includes("role.read");
    const canPerms = user.permissions.includes("permission.read");
    const canCats = user.permissions.includes("category.read");

    const [userCount, roleCount, permCount, catCount, recentArticles] = await Promise.all([
      canUsers ? this.prisma.user.count({ where: { status: "ACTIVE" } }) : Promise.resolve(null),
      canRoles ? this.prisma.role.count() : Promise.resolve(null),
      canPerms ? this.prisma.permission.count() : Promise.resolve(null),
      canCats ? this.prisma.category.count() : Promise.resolve(null),
      canArticles
        ? this.prisma.article.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              author: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve(null),
    ]);

    return { userCount, roleCount, permCount, catCount, recentArticles };
  }
}
