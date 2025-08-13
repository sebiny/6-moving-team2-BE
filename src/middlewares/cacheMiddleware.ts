import Redis from "ioredis";
import type { Request, Response, NextFunction } from "express";

let redis: Redis | null = null;

// 테스트 환경에서 무효화
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

const shouldCache = (req: Request) => {
  if (req.method !== "GET") return false;
  if (process.env.CACHE_DISABLED === "1") return false;
  if ("nocache" in req.query) return false; // ?nocache=1 우회
  if (req.headers.authorization) return false; // 토큰 있는 요청 제외
  const p = req.path;
  if (p.startsWith("/auth")) return false; // 인증 계열 제외
  if (p.startsWith("/notification")) return false; // 알림/SSE 제외
  return true;
};

export const cacheMiddleware = (ttl = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!redis || !shouldCache(req)) return next();

      const cacheKey = keyOf(req);
      const cached = await redis.get(cacheKey);

      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "no-store"); // 브라우저 캐시는 비활성
        res.type("application/json");
        return res.status(200).send(cached);
      }

      res.setHeader("X-Cache", "MISS");

      const originalJson = res.json.bind(res) as (body: any) => Response;
      const originalSend = res.send.bind(res) as (body: any) => Response;

      const save = (payloadStr: string) => {
        // 쿠키 내려보내는 응답은 캐시 금지
        if (res.getHeader("Set-Cookie")) return;
        res.setHeader("Cache-Control", "no-store");
        void redis!.setex(cacheKey, ttl, payloadStr);
      };

      res.json = ((data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          save(JSON.stringify(data));
        }
        return originalJson(data);
      }) as typeof res.json;

      res.send = ((data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let payloadStr: string;
          if (Buffer.isBuffer(data)) payloadStr = data.toString("utf8");
          else if (typeof data === "string") payloadStr = data;
          else payloadStr = JSON.stringify(data);
          save(payloadStr);
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

export const invalidateByExact = (key: string) => redis?.del(key);

export const invalidateByPrefix = async (prefix: string) => {
  if (!redis) return 0;
  let cursor = "0";
  let total = 0;
  do {
    const [next, keys]: [string, string[]] = await (redis as any).scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
    cursor = next;
    if (keys.length) {
      total += keys.length;
      const pipe = redis.pipeline();
      keys.forEach((k) => pipe.del(k));
      await pipe.exec();
    }
  } while (cursor !== "0");
  return total;
};
