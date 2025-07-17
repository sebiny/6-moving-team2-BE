"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/passport.ts
const passport_1 = __importDefault(require("passport"));
const jwtStrategy_1 = __importDefault(require("../middlewares/passport/jwtStrategy"));
const socialStrategy_1 = require("../middlewares/passport/socialStrategy");
passport_1.default.use("access-token", jwtStrategy_1.default.accessTokenStrategy);
passport_1.default.use("refresh-token", jwtStrategy_1.default.refreshTokenStrategy);
passport_1.default.use("google", socialStrategy_1.googleStrategy);
passport_1.default.use("kakao", socialStrategy_1.kakaoStrategy);
passport_1.default.use("naver", socialStrategy_1.naverStrategy);
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map