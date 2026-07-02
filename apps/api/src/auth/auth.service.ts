import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { GoogleProfile } from "./strategies/google.strategy";
import { RequestUser } from "./decorators/current-user.decorator";

interface OAuthUserPayload {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  roles: string[];
  permissions: string[];
}

interface OAuthCodeEntry {
  accessToken: string;
  user: OAuthUserPayload;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private readonly oauthCodes = new Map<string, OAuthCodeEntry>();

  generateOAuthCode(data: { accessToken: string; user: OAuthUserPayload }): string {
    const code = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60_000;
    this.oauthCodes.set(code, { ...data, expiresAt });
    setTimeout(() => this.oauthCodes.delete(code), 60_000);
    return code;
  }

  exchangeOAuthCode(code: string): { accessToken: string; user: OAuthUserPayload } {
    const entry = this.oauthCodes.get(code);
    if (!entry || entry.expiresAt < Date.now()) {
      this.oauthCodes.delete(code);
      throw new UnauthorizedException("Code không hợp lệ hoặc đã hết hạn");
    }
    this.oauthCodes.delete(code);
    return { accessToken: entry.accessToken, user: entry.user };
  }

  private sha256(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  private async buildUserPermissions(
    userId: string
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    const roles = userRoles.map((ur) => ur.role.name);
    const permSet = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permSet.add(rp.permission.code);
      }
    }

    return { roles, permissions: Array.from(permSet) };
  }

  private async generateTokens(
    user: { id: string; email: string },
    roles: string[],
    permissions: string[]
  ) {
    const payload = { sub: user.id, email: user.email, roles, permissions };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    });

    const rawRefreshToken = this.generateRefreshToken();
    const tokenHash = this.sha256(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) throw new ConflictException("Email đã được sử dụng");

    const hash = await bcrypt.hash(dto.password, 12);

    const studentRole = await this.prisma.role.findUnique({ where: { name: "Student" } });

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      if (studentRole) {
        await tx.userRole.create({ data: { userId: newUser.id, roleId: studentRole.id } });
      }

      return newUser;
    });

    const { roles, permissions } = await this.buildUserPermissions(user.id);
    const { accessToken, refreshToken } = await this.generateTokens(user, roles, permissions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles,
        permissions,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    if (!user || !user.password) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    if (user.status !== "ACTIVE") throw new UnauthorizedException("Tài khoản đã bị khoá");

    const { roles, permissions } = await this.buildUserPermissions(user.id);
    const { accessToken, refreshToken } = await this.generateTokens(user, roles, permissions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles,
        permissions,
      },
    };
  }

  async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return;
    const tokenHash = this.sha256(rawRefreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken) throw new UnauthorizedException("Không có refresh token");

    const tokenHash = this.sha256(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await this.prisma.user.findFirst({
      where: { id: stored.userId, deletedAt: null },
    });
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedException();

    const { roles, permissions } = await this.buildUserPermissions(user.id);
    const { accessToken, refreshToken } = await this.generateTokens(user, roles, permissions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles,
        permissions,
      },
    };
  }

  async me(currentUser: RequestUser) {
    const user = await this.prisma.user.findFirst({
      where: { id: currentUser.id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
      },
    });

    if (!user) throw new UnauthorizedException();

    return {
      ...user,
      roles: currentUser.roles,
      permissions: currentUser.permissions,
    };
  }

  async googleLogin(profile: GoogleProfile) {
    if (!profile.email) throw new BadRequestException("Không lấy được email từ Google");

    let user = await this.prisma.user.findFirst({
      where: { email: profile.email, deletedAt: null, status: "ACTIVE" },
    });

    const studentRole = await this.prisma.role.findUnique({ where: { name: "Student" } });

    if (!user) {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatar: profile.avatar,
            status: "ACTIVE",
          },
        });

        if (studentRole) {
          await tx.userRole.create({ data: { userId: newUser.id, roleId: studentRole.id } });
        }

        await tx.oAuthAccount.create({
          data: {
            userId: newUser.id,
            provider: "google",
            providerId: profile.providerId,
          },
        });

        return newUser;
      });
    } else {
      await this.prisma.oAuthAccount.upsert({
        where: { provider_providerId: { provider: "google", providerId: profile.providerId } },
        update: {},
        create: {
          userId: user.id,
          provider: "google",
          providerId: profile.providerId,
        },
      });
    }

    const { roles, permissions } = await this.buildUserPermissions(user.id);
    const { accessToken, refreshToken } = await this.generateTokens(user, roles, permissions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles,
        permissions,
      },
    };
  }
}
