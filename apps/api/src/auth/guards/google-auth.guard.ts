import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import * as crypto from "crypto";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  getAuthenticateOptions(context: ExecutionContext) {
    const res = context.switchToHttp().getResponse();
    const state = crypto.randomBytes(32).toString("hex");
    res.cookie("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
    });
    return { state };
  }
}
