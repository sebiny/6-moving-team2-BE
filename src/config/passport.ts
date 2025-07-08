// src/config/passport.ts
import passport from 'passport';
import jwt from '../middlewares/passport/JwtStrategy';
import { googleStrategy, kakaoStrategy, naverStrategy } from '../middlewares/passport/SocialStrategy';

// JWT 전략 등록
passport.use('access-token', jwt.accessTokenStrategy);
passport.use('refresh-token', jwt.refreshTokenStrategy);

// 소셜 전략 등록 (여기서 직접 new 하지 않고, 가져와서 등록)
passport.use('google', googleStrategy);
passport.use('kakao', kakaoStrategy);
passport.use('naver', naverStrategy);

export default passport;
