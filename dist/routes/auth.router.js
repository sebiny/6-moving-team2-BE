"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const passport_1 = __importDefault(require("../config/passport"));
const authRouter = express_1.default.Router();
// 회원가입
authRouter.post("/signup", auth_controller_1.default.signUp);
// 로그인
authRouter.post("/login", auth_controller_1.default.logIn);
// 로그아웃
authRouter.post("/logout", auth_controller_1.default.logOut);
// 소셜 로그인 시작
authRouter.get("/social/:provider", auth_controller_1.default.startSocialLogin);
// 소셜 로그인 콜백
authRouter.get("/social/:provider/callback", auth_controller_1.default.socialLoginCallback);
// 로그인된 유저 인증 정보 조회
authRouter.get("/me", passport_1.default.authenticate("access-token", { session: false, failWithError: true }), auth_controller_1.default.getMe);
// 액세스 토큰 재발급
authRouter.post("/refresh-token", passport_1.default.authenticate("refresh-token", { session: false, failWithError: true }), auth_controller_1.default.refreshToken);
exports.default = authRouter;
//# sourceMappingURL=auth.router.js.map