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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const auth_repository_1 = __importDefault(require("../repositories/auth.repository"));
const customError_1 = require("../utils/customError");
const userType_1 = require("../types/userType");
const notification_service_1 = require("./notification.service");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
}
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "60m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
// 회원가입
function signUpUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userType, email, phone, password, passwordConfirmation, name } = data;
        if (password !== passwordConfirmation) {
            throw new customError_1.CustomError(422, "비밀번호가 일치하지 않습니다.");
        }
        const existingUser = yield auth_repository_1.default.findByEmail(email);
        if (existingUser) {
            throw new customError_1.CustomError(409, "이미 사용중인 이메일입니다.");
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newUser = yield auth_repository_1.default.createAuthUser({
            email,
            phone,
            password: hashedPassword,
            userType,
            name,
            provider: client_1.AuthProvider.LOCAL,
            providerId: null
        });
        const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        // 알림 전송
        // 알림 전송 로직을 try...catch로 감쌈
        // 요청을 보내면 서버에서 성공한다면, noti 하면 된다. 트랜잭션 하지 말고. .then으로 관리할 것
        // 실무 방식은..?
        // 중간과정에서 가공이 필요하다면 별도의 테이블이 합리적
        // 액션테이블 : 분석, 감사 목적으로 만듦, 기록으로 남김
        // 알림테이블에서 클라이언트로 보냄,
        try {
            // 알림 전송 (비동기 처리를 위해 await을 붙이거나, 백그라운드 실행)
            notification_service_1.notificationService.createAndSendSignUpNotification(newUser);
        }
        catch (error) {
            // 알림 전송에 실패하더라도 회원가입은 성공해야 함
            // 에러를 로깅하여 추후 원인을 파악하고 수정
            console.error("알림 전송 실패:", error);
        }
        return userWithoutPassword;
    });
}
// 로그인
function signInUser(email, passwordInput) {
    return __awaiter(this, void 0, void 0, function* () {
        const authUser = yield auth_repository_1.default.findByEmail(email);
        if (!authUser || !authUser.password) {
            throw new customError_1.CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.");
        }
        const isPasswordValid = yield bcrypt_1.default.compare(passwordInput, authUser.password);
        if (!isPasswordValid) {
            throw new customError_1.CustomError(401, "이메일 또는 비밀번호가 일치하지 않습니다.");
        }
        const payload = {
            id: authUser.id,
            userType: authUser.userType
        };
        const accessToken = jsonwebtoken_1.default.sign({ userId: payload.id, userType: payload.userType }, // userType 추가
        JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: payload.id, userType: payload.userType }, // userType 추가
        JWT_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        });
        const user = {
            id: authUser.id,
            email: authUser.email,
            userType: authUser.userType,
            phone: authUser.phone,
            name: authUser.name
        };
        return { accessToken, refreshToken, user };
    });
}
// 액세스 토큰 재발급
function generateNewAccessToken(user) {
    return jsonwebtoken_1.default.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
}
// 소셜 로그인 후 토큰 발급
function handleSocialLogin(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const authUser = yield auth_repository_1.default.findById(user.id);
        if (!authUser) {
            throw new customError_1.CustomError(401, "사용자 정보를 찾을 수 없습니다.");
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        });
        const userResponse = {
            id: authUser.id,
            email: authUser.email,
            userType: authUser.userType,
            phone: authUser.phone,
            name: authUser.name
        };
        return { accessToken, refreshToken, user: userResponse };
    });
}
// 유저 ID로 조회
function getUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return auth_repository_1.default.findById(id);
    });
}
// 소셜 로그인 유저 조회 또는 생성
function findOrCreateOAuthUser(profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const { provider, providerId, email, displayName, profileImageUrl } = profile;
        if (provider === client_1.AuthProvider.LOCAL) {
            throw new customError_1.CustomError(400, "LOCAL 제공자는 소셜 로그인으로 사용할 수 없습니다.");
        }
        let authUser = yield auth_repository_1.default.findByProviderId(provider, providerId);
        if (!authUser) {
            if (!email) {
                throw new customError_1.CustomError(400, `소셜 프로필에 이메일 정보가 없습니다. (${provider})`);
            }
            const existingUser = yield auth_repository_1.default.findByEmail(email);
            if (existingUser) {
                throw new customError_1.CustomError(409, `이미 다른 계정으로 가입된 이메일입니다. (${existingUser.provider})`);
            }
            authUser = yield auth_repository_1.default.createAuthUser({
                email,
                phone: null,
                password: null,
                userType: userType_1.UserType.CUSTOMER,
                provider,
                providerId,
                name: displayName
            });
        }
        return {
            id: authUser.id,
            userType: authUser.userType
        };
    });
}
exports.default = {
    signUpUser,
    signInUser,
    generateNewAccessToken,
    handleSocialLogin,
    getUserById,
    findOrCreateOAuthUser
};
//# sourceMappingURL=auth.service.js.map