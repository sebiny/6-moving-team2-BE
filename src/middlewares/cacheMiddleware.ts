import Redis from "ioredis";
import "dotenv/config";
import type { Request, Response, NextFunction } from "express";

let redis: Redis | null = null;

// 테스트 환경이 아닐 때만 Redis 연결
if (process.env.NODE_ENV !== "test") {
  redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
        host: process.env.NODE_ENV === "production" ? process.env.REDIS_HOST : "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
        ...(process.env.NODE_ENV === "production" ? { tls: {} } : {})
      });

  redis.on("connect", () => console.log("Redis connected"));
  redis.on("ready", () => console.log("Redis ready"));
  redis.on("error", (err) => console.error("Redis error:", err));
}

// ── 캐시 미들웨어 (테스트 환경이면 패스) ──
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis || req.method !== "GET" || process.env.CACHE_DISABLED === "1") {
      return next();
    }

    try {
      const cacheKey = `cache:${req.originalUrl}`;
      const cached = await redis.get(cacheKey);
      if (cached) return res.status(200).json(JSON.parse(cached));

      const originalJson = res.json.bind(res) as (body: any) => Response;
      res.json = ((data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          void redis!.setex(cacheKey, ttl, JSON.stringify(data));
        }
        return originalJson(data);
      }) as typeof res.json;

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// ── 캐시 무효화 (테스트 환경이면 패스) ──
export const invalidateCache = (url: string | null = null) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!redis) return next();

    try {
      const cacheKey = `cache:${url ?? req.originalUrl}`;
      await redis.del(cacheKey);
      next();
    } catch (error) {
      console.error("Cache invalidation error:", error);
      next();
    }
  };
};

// 테스트 종료 시 Redis 연결 종료
export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};
