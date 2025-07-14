import express from "express";
import authController from "../controllers/auth.Controller";
import passport from "../config/passport";

const authRouter = express.Router();

// 회원가입
authRouter.post("/signup", authController.signUp);

// 로그인
authRouter.post("/login", authController.logIn);

// 로그아웃
authRouter.post("/logout", authController.logOut);

// 소셜 로그인 시작
authRouter.get("/social/:provider", authController.startSocialLogin);

// 소셜 로그인 콜백
authRouter.get("/social/:provider/callback", authController.socialLoginCallback);

// 로그인된 유저 인증 정보 조회
authRouter.get(
  "/me",
  passport.authenticate("access-token", { session: false, failWithError: true }),
  authController.getMe
);

// 액세스 토큰 재발급
authRouter.post(
  "/refresh-token",
  passport.authenticate("refresh-token", { session: false, failWithError: true }),
  authController.refreshToken
);

export default authRouter;
