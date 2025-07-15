// src/middlewares/passport/socialStrategy.ts

import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as KakaoStrategy } from "passport-kakao";
import { Strategy as NaverStrategy } from "passport-naver";
import authService from "../../services/auth.service";
import { Profile } from "passport";
import { AuthProvider } from "@prisma/client";
import { TokenUserPayload } from "../../services/auth.service";

type VerifyCallback = (error: any, user?: Express.User | false, info?: any) => void;

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, KAKAO_CLIENT_ID, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, SERVER_URL } =
  process.env;

if (
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET ||
  !KAKAO_CLIENT_ID ||
  !NAVER_CLIENT_ID ||
  !NAVER_CLIENT_SECRET ||
  !SERVER_URL
) {
  console.error("FATAL ERROR: Missing social login environment variables.");
  process.exit(1);
}

type NormalizedOAuthProfile = {
  provider: AuthProvider;
  providerId: string;
  email: string | null;
  displayName: string;
  profileImageUrl: string | null;
};

const createSocialVerify =
  (provider: AuthProvider) =>
  async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
      const normalizedProfile: NormalizedOAuthProfile = {
        provider,
        providerId: profile.id,
        email: profile.emails?.[0]?.value || null,
        displayName: profile.displayName || "User",
        profileImageUrl: profile.photos?.[0]?.value || null
      };

      const user: TokenUserPayload = await authService.findOrCreateOAuthUser(normalizedProfile);

      return done(null, user);
    } catch (error) {
      console.error(`Social login error for provider ${provider}:`, error);
      return done(error as Error);
    }
  };

export const googleStrategy = new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/api/auth/social/google/callback`
  },
  createSocialVerify(AuthProvider.GOOGLE)
);

export const kakaoStrategy = new KakaoStrategy(
  {
    clientID: KAKAO_CLIENT_ID,
    callbackURL: `${SERVER_URL}/api/auth/social/kakao/callback`
  },
  createSocialVerify(AuthProvider.KAKAO)
);

export const naverStrategy = new NaverStrategy(
  {
    clientID: NAVER_CLIENT_ID,
    clientSecret: NAVER_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/api/auth/social/naver/callback`
  },
  createSocialVerify(AuthProvider.NAVER)
);
