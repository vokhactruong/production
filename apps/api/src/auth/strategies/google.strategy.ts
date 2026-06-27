import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";

export interface GoogleProfile {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  accessToken: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:3001/auth/google/callback",
      scope: ["email", "profile"],
      passReqToCallback: false,
    });
  }

  validate(accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const firstName = profile.name?.givenName ?? "";
    const lastName = profile.name?.familyName ?? "";

    const googleProfile: GoogleProfile = {
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? "",
      firstName,
      lastName,
      avatar: profile.photos?.[0]?.value,
      accessToken,
    };
    done(null, googleProfile);
  }
}
