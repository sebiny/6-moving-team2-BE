"use strict";
// src/middlewares/passport/socialStrategy.ts
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
exports.naverStrategy = exports.kakaoStrategy = exports.googleStrategy = void 0;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_kakao_1 = require("passport-kakao");
const passport_naver_1 = require("passport-naver");
const auth_service_1 = __importDefault(require("../../services/auth.service"));
const client_1 = require("@prisma/client");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, KAKAO_CLIENT_ID, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, SERVER_URL } = process.env;
if (!GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !KAKAO_CLIENT_ID ||
    !NAVER_CLIENT_ID ||
    !NAVER_CLIENT_SECRET ||
    !SERVER_URL) {
    console.error("FATAL ERROR: Missing social login environment variables.");
    process.exit(1);
}
const createSocialVerify = (provider) => (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const normalizedProfile = {
            provider,
            providerId: profile.id,
            email: ((_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || null,
            displayName: profile.displayName || "User",
            profileImageUrl: ((_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || null
        };
        const user = yield auth_service_1.default.findOrCreateOAuthUser(normalizedProfile);
        return done(null, user);
    }
    catch (error) {
        console.error(`Social login error for provider ${provider}:`, error);
        return done(error);
    }
});
exports.googleStrategy = new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/api/auth/social/google/callback`
}, createSocialVerify(client_1.AuthProvider.GOOGLE));
exports.kakaoStrategy = new passport_kakao_1.Strategy({
    clientID: KAKAO_CLIENT_ID,
    callbackURL: `${SERVER_URL}/api/auth/social/kakao/callback`
}, createSocialVerify(client_1.AuthProvider.KAKAO));
exports.naverStrategy = new passport_naver_1.Strategy({
    clientID: NAVER_CLIENT_ID,
    clientSecret: NAVER_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/api/auth/social/naver/callback`
}, createSocialVerify(client_1.AuthProvider.NAVER));
//# sourceMappingURL=socialStrategy.js.map