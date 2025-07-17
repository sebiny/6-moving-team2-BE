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
// middlewares/passport/JwtStrategy.ts
const passport_jwt_1 = require("passport-jwt");
const auth_service_1 = __importDefault(require("../../services/auth.service"));
if (!process.env.JWT_SECRET) {
    console.error("치명적 오류: JWT_SECRET 환경 변수가 설정되지 않았습니다.");
    process.exit(1);
}
const accessTokenOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: false
};
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies["refreshToken"];
    }
    return token;
};
const refreshTokenOptions = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: false
};
function jwtVerify(payload, done) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield auth_service_1.default.getUserById(payload.userId);
            if (!user) {
                return done(null, false);
            }
            const userPayload = {
                id: user.id,
                userType: user.userType
            };
            return done(null, userPayload);
        }
        catch (error) {
            return done(error, false);
        }
    });
}
const accessTokenStrategy = new passport_jwt_1.Strategy(accessTokenOptions, jwtVerify);
const refreshTokenStrategy = new passport_jwt_1.Strategy(refreshTokenOptions, jwtVerify);
exports.default = {
    accessTokenStrategy,
    refreshTokenStrategy
};
//# sourceMappingURL=jwtStrategy.js.map