import Redis from "ioredis";
import type { Request, Response, NextFunction } from "express";

let redis: Redis | null = null;

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

const keyOf = (req: Request) => `cache:GET:${req.originalUrl}`;

export const cacheMiddleware = (ttl = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // GET만 캐시
      if (!redis || req.method !== "GET" || process.env.CACHE_DISABLED === "1") return next();

      const cacheKey = keyOf(req);
      const cached = await redis.get(cacheKey);

      if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        return res.status(200).json(JSON.parse(cached));
      }

      console.log(`[CACHE MISS] ${cacheKey}`);

      // res.json / res.send 둘 다 캐치해서 저장
      const originalJson = res.json.bind(res) as (body: any) => Response;
      const originalSend = res.send.bind(res) as (body: any) => Response;

      const save = (data: any) => {
        // JSON 문자열이면 그대로, 아니면 stringify
        const payload = typeof data === "string" ? data : JSON.stringify(data);
        void redis!.setex(cacheKey, ttl, payload).then(() => {
          console.log(`[CACHE SET] ${cacheKey} (ttl=${ttl}s)`);
        });
      };

      res.json = ((data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) save(data);
        return originalJson(data);
      }) as typeof res.json;

      res.send = ((data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // send로 들어오면 JSON 보장 안 되니 최대한 처리
          try {
            const maybeObj = typeof data === "string" ? JSON.parse(data) : data;
            save(maybeObj);
          } catch {
            save(data);
          }
        }
        return originalSend(data);
      }) as typeof res.send;

      next();
    } catch (err) {
      console.error("Cache middleware error:", err);
      next();
    }
  };
};

//  특정 키/프리픽스 무효화 유틸
export const invalidateByExact = (key: string) => redis?.del(key);
export const invalidateByPrefix = async (prefix: string) => {
  if (!redis) return;
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length) await redis.del(keys);
};
