import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import * as crypto from "crypto";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  // Used on GET /auth/google — generates state cookie before redirecting to Google
  getAuthenticateOptions(context: ExecutionContext) {
    const res = context.switchToHttp().getResponse();
    const state = crypto.randomBytes(32).toString("hex");
    res.cookie("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });
    return { state };
  }
}

@Injectable()
export class GoogleCallbackGuard extends AuthGuard("google") {
  // Used on GET /auth/google/callback — validates state BEFORE Passport exchanges the code
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      query: Record<string, string>;
      cookies: Record<string, string>;
    }>();

    const stateQuery = req.query["state"];
    const stateCookie = req.cookies["oauth_state"];

    if (!stateQuery || !stateCookie || stateQuery !== stateCookie) {
      throw new UnauthorizedException("OAuth state không hợp lệ");
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
