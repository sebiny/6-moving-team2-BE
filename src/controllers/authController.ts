import { Request, Response, NextFunction } from "express";
import authService, { TokenUserPayload } from "../services/authService";
import passport from "../config/passport";
import { asyncHandler } from "../utils/asyncHandler";
import { UserType } from "@prisma/client";
import { CustomError } from "../utils/customError";

declare global {
  namespace Express {
    interface User extends TokenUserPayload {}
  }
}

// 회원가입
const signUp = asyncHandler(async (req: Request, res: Response) => {
  const { userType, name, email, phone, password, passwordConfirmation } = req.body;

  if (!userType || !email || !phone || !password || !passwordConfirmation || !name) {
    throw new CustomError(422, "필수 필드를 모두 입력해주세요. (name 포함)");
  }

  if (![UserType.CUSTOMER, UserType.DRIVER].includes(userType)) {
    throw new CustomError(422, "userType은 'CUSTOMER' 또는 'DRIVER' 여야 합니다.");
  }

  const commonData = { email, phone, password, passwordConfirmation, name, userType };

  const result = await authService.signUpUser(commonData);

  res.status(201).json(result);
});

// 로그인
const logIn = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError(422, "이메일과 비밀번호를 입력해주세요.");
  }

  const { accessToken, refreshToken, user } = await authService.signInUser(email, password);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true
  });

  res.json({ accessToken, user });
});

// 로그아웃
const logOut = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true
  });
  res.status(200).json({ message: "성공적으로 로그아웃되었습니다." });
});

// 지원하는 소셜 로그인 provider 목록
const SUPPORTED_PROVIDERS = ["google", "kakao", "naver"] as const;
type Provider = (typeof SUPPORTED_PROVIDERS)[number];

// 소셜 로그인 시작
const startSocialLogin = (req: Request, res: Response, next: NextFunction) => {
  const { provider } = req.params;

  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    res.status(400).json({ message: "지원하지 않는 소셜 로그인입니다." });
    return;
  }

  passport.authenticate(provider, {
    scope: ["profile", "email"]
  })(req, res, next);
};

// 소셜 로그인 콜백
const socialLoginCallback = (req: Request, res: Response, next: NextFunction) => {
  const { provider } = req.params;
  const failureRedirectUrl = `${process.env.CLIENT_URL}/auth/fail?provider=${provider}&message=social_login_failed`;

  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    return res.redirect(failureRedirectUrl);
  }

  passport.authenticate(
    provider,
    { session: false },
    async (err: Error | null, user?: TokenUserPayload): Promise<void> => {
      if (err || !user) {
        res.redirect(failureRedirectUrl);
        return;
      }

      try {
        const { accessToken, refreshToken } = await authService.handleSocialLogin(user);
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          path: "/",
          sameSite: "none",
          secure: true
        });
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}`);
        return;
      } catch (error) {
        next(error);
      }
    }
  )(req, res, next);
};

// 로그인된 유저 인증 정보 조회
const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new CustomError(401, "인증 정보가 없습니다.");
  }
  res.json({ user: req.user });
});

// 액세스 토큰 재발급
const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new CustomError(401, "토큰 갱신을 위한 사용자 정보가 없습니다.");
  }
  const newAccessToken = authService.generateNewAccessToken(req.user);
  res.json({ accessToken: newAccessToken });
});

export default {
  signUp,
  logIn,
  logOut,
  startSocialLogin,
  socialLoginCallback,
  getMe,
  refreshToken
};
