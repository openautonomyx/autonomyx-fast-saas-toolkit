import type { Redis } from "ioredis";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface RateLimiterOptions {
  redis: Redis;
  /** Requests per window (default: 100) */
  maxRequests?: number;
  /** Window size in seconds (default: 60) */
  windowSeconds?: number;
  /** Per-plan overrides */
  planLimits?: Record<string, number>;
}

/**
 * Sliding-window rate limiter using Redis.
 * Limits are per-tenant (after auth) or per-IP (before auth).
 * Respects per-plan limits when tenant context is available.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    redis,
    maxRequests = 100,
    windowSeconds = 60,
    planLimits = {
      free: 60,
      starter: 300,
      pro: 1000,
      enterprise: 5000,
    },
  } = options;

  return async (
    req: IncomingMessage & { auth?: any; tenantContext?: any },
    res: ServerResponse,
    next: (err?: Error) => void
  ) => {
    try {
      // Determine rate limit key and limit
      let key: string;
      let limit: number;

      if (req.tenantContext?.tenant) {
        key = `rl:tenant:${req.tenantContext.tenant.id}`;
        limit = planLimits[req.tenantContext.tenant.plan] || maxRequests;
      } else {
        // Pre-auth: rate limit by IP
        const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()
          || req.socket.remoteAddress
          || "unknown";
        key = `rl:ip:${ip}`;
        limit = maxRequests;
      }

      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - windowSeconds;

      // Sliding window using sorted set
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`);
      pipeline.zcard(key);
      pipeline.expire(key, windowSeconds);
      const results = await pipeline.exec();

      const currentCount = (results?.[2]?.[1] as number) || 0;

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", limit.toString());
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - currentCount).toString());
      res.setHeader("X-RateLimit-Reset", (now + windowSeconds).toString());

      if (currentCount > limit) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: windowSeconds,
        }));
        return;
      }

      next();
    } catch (err) {
      // Fail open — don't block requests if Redis is down
      next();
    }
  };
}
