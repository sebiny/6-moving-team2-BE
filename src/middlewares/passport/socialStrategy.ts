// src/middlewares/passport/socialStrategy.ts

import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as KakaoStrategy } from "passport-kakao";
import { Strategy as NaverStrategy } from "passport-naver";
import authService from "../../services/auth.service";
import { Profile as PassportProfile } from "passport";
import { AuthProvider, UserType } from "@prisma/client";
import { TokenUserPayload } from "../../services/auth.service";
import { Request } from "express";

type VerifiedCallback = (error: any, user?: Express.User | false, info?: any) => void;

// Profile 타입 확장 (passport 기본 Profile에 _json 프로퍼티 추가)
interface ProfileWithJson extends PassportProfile {
  _json?: any;
}

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  KAKAO_CLIENT_ID,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  SERVER_URL,
  CLIENT_URL
} = process.env;

if (
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET ||
  !KAKAO_CLIENT_ID ||
  !NAVER_CLIENT_ID ||
  !NAVER_CLIENT_SECRET ||
  !SERVER_URL ||
  !CLIENT_URL
) {
  console.error("환경 변수 누락");
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
  async (req: Request, accessToken: string, refreshToken: string, profile: ProfileWithJson, done: VerifiedCallback) => {
    try {
      let email: string | null = null;

      if (provider === AuthProvider.KAKAO) {
        // 카카오 이메일은 profile._json.kakao_account.email 경로에서 추출
        email = profile._json?.kakao_account?.email || null;
      } else {
        // 구글, 네이버 등은 profile.emails[0].value 에서 이메일 추출
        email = profile.emails?.[0]?.value || null;
      }

      // state에 담겨온 userType 추출, 없으면 CUSTOMER로 기본값 설정
      const userType = (req.query.state as UserType) || UserType.CUSTOMER;

      const normalizedProfile: NormalizedOAuthProfile = {
        provider,
        providerId: profile.id,
        email,
        displayName: profile.displayName || "User",
        profileImageUrl: profile.photos?.[0]?.value || null
      };

      const user: TokenUserPayload = await authService.findOrCreateOAuthUser(normalizedProfile, userType);

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
    callbackURL: `${SERVER_URL}/auth/social/google/callback`,
    passReqToCallback: true
  },
  createSocialVerify(AuthProvider.GOOGLE)
);

export const kakaoStrategy = new KakaoStrategy(
  {
    clientID: KAKAO_CLIENT_ID,
    callbackURL: `${SERVER_URL}/auth/social/kakao/callback`,
    passReqToCallback: true
  },
  createSocialVerify(AuthProvider.KAKAO)
);

export const naverStrategy = new NaverStrategy(
  {
    clientID: NAVER_CLIENT_ID,
    clientSecret: NAVER_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/auth/social/naver/callback`,
    passReqToCallback: true
  },
  createSocialVerify(AuthProvider.NAVER)
);
