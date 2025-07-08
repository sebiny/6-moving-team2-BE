// middlewares/passport/socialStrategy.ts
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver';
import userService from '../../services/userService';
import { Profile, VerifyCallback } from 'passport';
import { AuthProvider } from '@prisma/client';
import { TokenUserPayload } from '../../services/authService';

// 환경 변수 로드 및 유효성 검사
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  KAKAO_CLIENT_ID,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  SERVER_URL,
} = process.env;

if (
  !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !KAKAO_CLIENT_ID ||
  !NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || !SERVER_URL
) {
  console.error('FATAL ERROR: Missing social login environment variables.');
  process.exit(1);
}
// OAuth 제공자로부터 받은 프로필 정보를 서비스 레이어에서 사용하기 쉽도록 정규화한 타입입니다.
// 가급적 userService에서 정의하고 export하는 것이 좋습니다.
type NormalizedOAuthProfile = {
  provider: AuthProvider;
  providerId: string;
  email: string | null;
  displayName: string;
  profileImageUrl: string | null;
};

/**
 * 다양한 소셜 로그인 전략(Google, Kakao, Naver)을 위한 공통 verify 콜백을 생성하는 팩토리 함수입니다.
 * 사용자 조회/생성 로직을 중앙에서 관리하여 코드 중복을 제거합니다.
 * @param provider OAuth 제공자 (예: 'GOOGLE', 'KAKAO', 'NAVER').
 */
const createSocialVerify =
  (provider: AuthProvider) =>
  async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
      // Passport로부터 받은 프로필 객체를 NormalizedOAuthProfile 타입에 맞게 정규화합니다.
      // 제공자마다 다른 데이터 형식(예: 이메일, 프로필 사진 필드명)을 여기서 통일합니다.
      const normalizedProfile: NormalizedOAuthProfile = {
        provider,
        providerId: profile.id,
        email: profile.emails?.[0]?.value || null,
        displayName: profile.displayName || 'User', // 표시 이름이 없는 경우를 대비한 기본값 설정
        profileImageUrl: profile.photos?.[0]?.value || null,
      };

      // 핵심 로직(기존 사용자 조회, 계정 연결, 신규 사용자 생성 등)을 서비스 레이어에 위임합니다.
      // Passport 전략은 인증 흐름과 데이터 정규화에만 집중하여 역할을 명확히 합니다.
      const user: TokenUserPayload = await userService.findOrCreateOAuthUser(normalizedProfile);

      // 최종 사용자 페이로드를 Passport에 전달합니다. 이 값은 이후 `req.user` 객체로 사용됩니다.
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
    callbackURL: `${SERVER_URL}/api/auth/social/google/callback`,
  },
  createSocialVerify(AuthProvider.GOOGLE)
);

export const kakaoStrategy = new KakaoStrategy(
  {
    clientID: KAKAO_CLIENT_ID,
    callbackURL: `${SERVER_URL}/api/auth/social/kakao/callback`,
  },
  createSocialVerify(AuthProvider.KAKAO)
);

export const naverStrategy = new NaverStrategy(
  {
    clientID: NAVER_CLIENT_ID,
    clientSecret: NAVER_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/api/auth/social/naver/callback`,
  },
  createSocialVerify(AuthProvider.NAVER)
);
