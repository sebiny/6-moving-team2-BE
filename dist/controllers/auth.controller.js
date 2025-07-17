"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
const passport_1 = __importDefault(require("../config/passport"));
const asyncHandler_1 = require("../utils/asyncHandler");
const client_1 = require("@prisma/client");
const customError_1 = require("../utils/customError");
// 회원가입
const signUp = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userType, name, email, phone, password, passwordConfirmation } = req.body;
    if (!userType || !email || !phone || !password || !passwordConfirmation || !name) {
        throw new customError_1.CustomError(422, "필수 필드를 모두 입력해주세요. (name 포함)");
    }
    if (![client_1.UserType.CUSTOMER, client_1.UserType.DRIVER].includes(userType)) {
        throw new customError_1.CustomError(422, "userType은 'CUSTOMER' 또는 'DRIVER' 여야 합니다.");
    }
    const commonData = { email, phone, password, passwordConfirmation, name, userType };
    const result = yield auth_service_1.default.signUpUser(commonData);
    res.status(201).json(result);
}));
// 로그인
const logIn = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new customError_1.CustomError(422, "이메일과 비밀번호를 입력해주세요.");
    }
    const { accessToken, refreshToken, user } = yield auth_service_1.default.signInUser(email, password);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true
    });
    res.json({ accessToken, user });
}));
// 로그아웃
const logOut = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true
    });
    res.status(200).json({ message: "성공적으로 로그아웃되었습니다." });
}));
// 지원하는 소셜 로그인 provider 목록
const SUPPORTED_PROVIDERS = ["google", "kakao", "naver"];
// 소셜 로그인 시작
const startSocialLogin = (req, res, next) => {
    const { provider } = req.params;
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
        res.status(400).json({ message: "지원하지 않는 소셜 로그인입니다." });
        return;
    }
    passport_1.default.authenticate(provider, {
        scope: ["profile", "email"]
    })(req, res, next);
};
// 소셜 로그인 콜백
const socialLoginCallback = (req, res, next) => {
    const { provider } = req.params;
    const failureRedirectUrl = `${process.env.CLIENT_URL}/auth/fail?provider=${provider}&message=social_login_failed`;
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
        return res.redirect(failureRedirectUrl);
    }
    passport_1.default.authenticate(provider, { session: false }, (err, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (err || !user) {
            res.redirect(failureRedirectUrl);
            return;
        }
        try {
            const { accessToken, refreshToken } = yield auth_service_1.default.handleSocialLogin(user);
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                path: "/",
                sameSite: "none",
                secure: true
            });
            res.redirect(`${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}`);
            return;
        }
        catch (error) {
            next(error);
        }
    }))(req, res, next);
};
// 로그인된 유저 인증 정보 조회
const getMe = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new customError_1.CustomError(401, "인증 정보가 없습니다.");
    }
    res.json({ user: req.user });
}));
// 액세스 토큰 재발급
const refreshToken = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new customError_1.CustomError(401, "토큰 갱신을 위한 사용자 정보가 없습니다.");
    }
    const newAccessToken = auth_service_1.default.generateNewAccessToken(req.user);
    res.json({ accessToken: newAccessToken });
}));
exports.default = {
    signUp,
    logIn,
    logOut,
    startSocialLogin,
    socialLoginCallback,
    getMe,
    refreshToken
};
//# sourceMappingURL=auth.controller.js.map