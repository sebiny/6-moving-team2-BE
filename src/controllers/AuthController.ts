import express, { Request, Response, NextFunction } from 'express';
import authService, { TokenUserPayload } from '../services/authService';
import passport from '../config/passport';
import { asyncHandler } from '../utils/asyncHandler';
import { UserType } from '@prisma/client';
import { CustomError } from '../utils/CustomError';

declare global {
  namespace Express {
    interface User extends TokenUserPayload {}
  }
}

const authController = express.Router();

// 회원가입
authController.post(
  '/signup',
  asyncHandler(async (req: Request, res: Response) => {
    const { userType, name, nickname, email, phone, password, passwordConfirmation } = req.body;

    if (!userType || !email || !phone || !password || !passwordConfirmation) {
      throw new CustomError(422, '공통 필수 필드를 입력해주세요.');
    }

    if (userType === UserType.CUSTOMER) {
      if (!name) throw new CustomError(422, '고객 가입 시 이름(name)은 필수입니다.');
    } else if (userType === UserType.DRIVER) {
      if (!nickname) throw new CustomError(422, '기사 가입 시 닉네임(nickname)은 필수입니다.');
    } else {
      throw new CustomError(422, "userType은 'CUSTOMER' 또는 'DRIVER' 여야 합니다.");
    }

    const commonData = { email, phone, password, passwordConfirmation };
    const result = await authService.signUpUser(
      userType === UserType.CUSTOMER ? { ...commonData, userType, name } : { ...commonData, userType, nickname }
    );

    res.status(201).json(result);
  })
);

// 로그인
authController.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new CustomError(422, '이메일과 비밀번호를 입력해주세요.');
    }

    const { accessToken, refreshToken, user } = await authService.signInUser(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true
    });

    res.json({ accessToken, user });
  })
);

// 로그아웃
authController.post(
  '/logout',
  asyncHandler(async (_req, res: Response) => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true
    });
    res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
  })
);

// 지원하는 소셜 로그인 provider 목록
const SUPPORTED_PROVIDERS = ['google', 'kakao', 'naver'] as const;
type Provider = (typeof SUPPORTED_PROVIDERS)[number];

// 소셜 로그인 시작
authController.get('/social/:provider', (req: Request, res: Response, next: NextFunction) => {
  const { provider } = req.params;

  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    return res.status(400).json({ message: '지원하지 않는 소셜 로그인입니다.' });
  }

  passport.authenticate(provider, {
    scope: ['profile', 'email']
  })(req, res, next);
});

// 소셜 로그인 콜백 (서비스 분리 적용)
authController.get('/social/:provider/callback', (req, res, next) => {
  const { provider } = req.params;

  const failureRedirectUrl = `${process.env.CLIENT_URL}/auth/fail?provider=${provider}&message=social_login_failed`;

  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    return res.redirect(failureRedirectUrl);
  }

  passport.authenticate(provider, { session: false }, async (err: Error | null, user: TokenUserPayload | undefined) => {
    if (err || !user) {
      return res.redirect(failureRedirectUrl);
    }

    try {
      const { accessToken, refreshToken } = await authService.handleSocialLogin(user);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true
      });

      res.redirect(`${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}`);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

// 로그인된 유저 인증 정보 조회
authController.get(
  '/me',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new CustomError(401, '인증 정보가 없습니다.');
    }

    res.json({ user: req.user });
  })
);

// 액세스 토큰 재발급
authController.post(
  '/refresh-token',
  passport.authenticate('refresh-token', { session: false, failWithError: true }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new CustomError(401, '토큰 갱신을 위한 사용자 정보가 없습니다.');
    }

    const newAccessToken = authService.generateNewAccessToken(req.user);
    res.json({ accessToken: newAccessToken });
  })
);

export default authController;
