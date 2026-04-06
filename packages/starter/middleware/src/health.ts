import type { Pool } from "pg";
import type Redis from "ioredis";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface HealthCheckOptions {
  db: Pool;
  redis: Redis;
}

interface ServiceHealth {
  status: "healthy" | "unhealthy";
  latencyMs: number;
  error?: string;
}

/**
 * Health check endpoint handler.
 * Returns status of PostgreSQL and Redis connections.
 *
 * Mount at GET /health or GET /api/health.
 */
export function createHealthCheck(options: HealthCheckOptions) {
  const { db, redis } = options;

  return async (_req: IncomingMessage, res: ServerResponse) => {
    const checks: Record<string, ServiceHealth> = {};

    // Check PostgreSQL
    const pgStart = performance.now();
    try {
      await db.query("SELECT 1");
      checks.postgres = { status: "healthy", latencyMs: Math.round(performance.now() - pgStart) };
    } catch (err) {
      checks.postgres = { status: "unhealthy", latencyMs: Math.round(performance.now() - pgStart), error: (err as Error).message };
    }

    // Check Redis
    const redisStart = performance.now();
    try {
      await redis.ping();
      checks.redis = { status: "healthy", latencyMs: Math.round(performance.now() - redisStart) };
    } catch (err) {
      checks.redis = { status: "unhealthy", latencyMs: Math.round(performance.now() - redisStart), error: (err as Error).message };
    }

    const allHealthy = Object.values(checks).every(c => c.status === "healthy");
    const statusCode = allHealthy ? 200 : 503;

    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: checks,
    }));
  };
}
