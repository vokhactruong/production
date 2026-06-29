import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { AuthGuard } from "./guards/auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET environment variable is not set");
        return { secret, signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, AuthGuard, GoogleAuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
