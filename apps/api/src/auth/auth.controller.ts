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
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, ExchangeOAuthCodeDto } from "./dto/auth.dto";
import { Public } from "./decorators/public.decorator";
import { AuthGuard } from "./guards/auth.guard";
import { CurrentUser, RequestUser } from "./decorators/current-user.decorator";
import { GoogleProfile } from "./strategies/google.strategy";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "none" as const,
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
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @ApiOperation({ summary: "Đăng ký tài khoản" })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...response } = await this.authService.register(dto);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    return response;
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Đăng nhập" })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...response } = await this.authService.login(dto);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    return response;
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
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Làm mới access token" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    console.log("\n========== REFRESH ==========");
    console.log("Time:", new Date().toISOString());
    console.log("Origin:", req.headers.origin);
    console.log("Host:", req.headers.host);
    console.log("Cookie Header:", req.headers.cookie);
    console.log("Parsed Cookies:", req.cookies);

    const token = req.cookies?.["refreshToken"] as string | undefined;

    console.log("Refresh Token:", token ? `${token.substring(0, 20)}...` : "❌ NOT FOUND");

    if (!token) {
      console.log("❌ REFRESH FAILED: No refresh token");
      throw new UnauthorizedException("Không có refresh token");
    }

    try {
      const { refreshToken, ...response } = await this.authService.refresh(token);

      console.log("✅ REFRESH SUCCESS");

      res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

      return response;
    } catch (error) {
      console.error("❌ REFRESH ERROR:", error);

      throw error;
    }
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Thông tin user hiện tại" })
  async me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user);
  }

  @Public()
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Đăng nhập với Google" })
  async googleAuth() {
    // Passport redirects to Google — this body never executes
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

    const code = this.authService.generateOAuthCode({
      accessToken: result.accessToken,
      user: result.user,
    });

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    return res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }

  @Public()
  @Post("oauth/exchange")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Exchange one-time OAuth code for access token" })
  async exchangeOAuthCode(@Body() dto: ExchangeOAuthCodeDto) {
    return this.authService.exchangeOAuthCode(dto.code);
  }
}
