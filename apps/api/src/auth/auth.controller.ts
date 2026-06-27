import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard as PassportAuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response, Request } from "express";
import * as crypto from "crypto";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { Public } from "./decorators/public.decorator";
import { AuthGuard } from "./guards/auth.guard";
import { CurrentUser, RequestUser } from "./decorators/current-user.decorator";
import { GoogleProfile } from "./strategies/google.strategy";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

@ApiTags("Auth")
@Controller("auth")
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Đăng ký tài khoản" })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
    return result;
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Đăng nhập" })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
    return result;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đăng xuất" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.["refreshToken"] as string | undefined;
    if (token) await this.authService.logout(token);
    res.clearCookie("refreshToken", { path: "/" });
    return { message: "Đăng xuất thành công" };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Làm mới access token" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.["refreshToken"] as string | undefined;
    if (!token) throw new UnauthorizedException("Không có refresh token");
    const result = await this.authService.refresh(token);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
    return result;
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Thông tin user hiện tại" })
  async me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user);
  }

  @Public()
  @Get("google")
  @UseGuards(PassportAuthGuard("google"))
  @ApiOperation({ summary: "Đăng nhập với Google" })
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    const state = crypto.randomBytes(32).toString("hex");
    res.cookie("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
    });
    return res.redirect(`/auth/google?state=${state}`);
  }

  @Public()
  @Get("google/callback")
  @UseGuards(PassportAuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(@Req() req: Request & { user: GoogleProfile }, @Res() res: Response) {
    const stateQuery = req.query?.["state"] as string | undefined;
    const stateCookie = req.cookies?.["oauth_state"] as string | undefined;

    if (!stateQuery || !stateCookie || stateQuery !== stateCookie) {
      throw new UnauthorizedException("OAuth state không hợp lệ");
    }

    res.clearCookie("oauth_state");

    const result = await this.authService.googleLogin(req.user);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    return res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }
}
