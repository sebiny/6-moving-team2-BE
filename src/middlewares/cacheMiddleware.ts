import Redis from "ioredis";
import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import "dotenv/config";

// 테스트 환경에서 비활성
const isTest = process.env.NODE_ENV === "test";

// Redis 클라이언트
export const redis: Redis | null = isTest
  ? null
  : new Redis({
      host: process.env.NODE_ENV === "production" ? process.env.REDIS_HOST : "127.0.0.1",
      port: Number(process.env.REDIS_PORT ?? 6379),
      ...(process.env.NODE_ENV === "production" ? { tls: {} } : {})
    });

redis?.on("connect", () => console.log("Redis connected"));
redis?.on("ready", () => console.log("Redis ready"));
redis?.on("error", (err) => console.error("Redis error:", err));

// 쿼리 정렬
function normalizedUrl(req: Request): string {
  const u = new URL(req.originalUrl, "http://x");
  u.searchParams.sort();
  return `${u.pathname}?${u.searchParams.toString()}`;
}

// 본문 해시(GET이 아닐 때)
function bodyHash(req: Request): string {
  if (req.method.toUpperCase() === "GET") return "nobody";
  const body = (req as any).body;
  if (!body || typeof body !== "object") return "nobody";
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  const ok = ct.includes("application/json") || ct.includes("application/x-www-form-urlencoded");
  if (!ok) return "nobody";
  try {
    const s = JSON.stringify(body);
    if (Buffer.byteLength(s, "utf8") > 64 * 1024) return "nobody"; // 과도한 키 방지
    return createHash("sha1").update(s).digest("hex");
  } catch {
    return "nobody";
  }
}

function keyOf(req: Request): string {
  return `cache:${req.method.toUpperCase()}:${normalizedUrl(req)}:${bodyHash(req)}`;
}

/** 같은 URL의 모든 변형 캐시 무효화 (모든 메서드/바디 해시) */
async function invalidateVariants(normUrl: string) {
  if (!redis) return 0;
  const pattern = `cache:*:${normUrl}:*`;
  let cursor = "0";
  let total = 0;
  do {
    const [nextCursor, keys]: [string, string[]] = await (redis as any).scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length) {
      const pipe = redis.pipeline();
      keys.forEach((k) => pipe.del(k));
      await pipe.exec();
      total += keys.length;
    }
  } while (cursor !== "0");
  return total;
}

// 캐시 미들웨어
export const cacheMiddleware = (ttl = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 테스트 / Redis 미연결 / 강제 우회 시 통과
      if (isTest || !redis || "nocache" in (req.query as any)) return next();

      const cacheKey = keyOf(req);
      const cached = await redis.get(cacheKey);
      console.log("cachedData 여부", !!cached);

      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "no-store");
        const parsed = JSON.parse(cached);
        return res.status(200).json(parsed);
      }

      res.setHeader("X-Cache", "MISS");

      const normUrl = normalizedUrl(req);
      const method = req.method.toUpperCase();

      const originalJson = res.json.bind(res) as (body: any) => Response;
      res.json = function (data: any): Response {
        const is2xx = res.statusCode >= 200 && res.statusCode < 300;
        const hasSetCookie = !!res.getHeader("Set-Cookie");

        if (is2xx && (method === "PUT" || method === "PATCH" || method === "DELETE")) {
          void invalidateVariants(normUrl);
        } else if (is2xx && !hasSetCookie) {
          try {
            void redis!.setex(cacheKey, ttl, JSON.stringify(data));
          } catch {}
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// 캐시 무효화 미들웨어
export const invalidateCache = (url: string | null = null) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!redis) return next();

      const target = url ?? req.originalUrl;
      const u = new URL(target, "http://x");
      u.searchParams.sort();
      const norm = `${u.pathname}?${u.searchParams.toString()}`;

      const deleted = await invalidateVariants(norm);
      console.log(`Invalidated cache for: ${norm} (deleted ${deleted})`);
      next();
    } catch (error) {
      console.error("Cache invalidation error:", error);
      next();
    }
  };
};
