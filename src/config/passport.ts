// src/config/passport.ts
import passport from "passport";
import jwt from "../middlewares/passport/jwtStrategy";
import { googleStrategy, kakaoStrategy, naverStrategy } from "../middlewares/passport/socialStrategy";

passport.use("access-token", jwt.accessTokenStrategy);
passport.use("refresh-token", jwt.refreshTokenStrategy);

passport.use("google", googleStrategy);
passport.use("kakao", kakaoStrategy);
passport.use("naver", naverStrategy);

export default passport;
