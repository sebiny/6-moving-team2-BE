import express from "express";
import authController from "../controllers/auth.controller";
import { authLimiter } from "../middlewares/authLimiter";
import passport from "../config/passport";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const authRouter = express.Router();

// 회원가입
authRouter.post("/signup", authLimiter, authController.signUp);
// 로그인
authRouter.post("/login", authLimiter, authController.logIn);

// 로그아웃
authRouter.post("/logout", authController.logOut);

// 소셜 로그인 시작
authRouter.get("/social/:provider", cacheMiddleware(300), authController.startSocialLogin);

// 소셜 로그인 콜백
authRouter.get("/social/:provider/callback", cacheMiddleware(300), authController.socialLoginCallback);

// 로그인된 유저 인증(최소) 정보 조회
authRouter.get(
  "/me",
  passport.authenticate("access-token", { session: false, failWithError: false }),
  cacheMiddleware(300),
  authController.getMe
);

// 로그인된 유저 자세한 정보 조회
authRouter.get(
  "/me/detail",
  passport.authenticate("access-token", { session: false, failWithError: false }),
  cacheMiddleware(300),
  authController.getUserById
);

// 로그인된 유저 이름 조회
authRouter.get(
  "/me/name",
  passport.authenticate("access-token", { session: false, failWithError: false }),
  cacheMiddleware(300),
  authController.getMeName
);

// 액세스 토큰 재발급
authRouter.post(
  "/refresh-token",
  passport.authenticate("refresh-token", { session: false, failWithError: false }),
  cacheMiddleware(300),
  authController.refreshToken
);

export default authRouter;
