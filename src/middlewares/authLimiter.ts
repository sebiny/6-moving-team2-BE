import rateLimit from "express-rate-limit";
import { RateLimitRequestHandler } from "express-rate-limit";

// API 호출 횟수 제한
const authLimiter: RateLimitRequestHandler = rateLimit({
  limit: 10, // 10회 제한
  windowMs: 10 * 60 * 1000, // 10분
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "너무 많은 요청을 하셨습니다. 나중에 다시 시도해주세요." },
  handler: (req, res, next, options) => {
    res.status(typeof options.statusCode === "number" ? options.statusCode : 429).json(options.message);
  }
});

export { authLimiter };
