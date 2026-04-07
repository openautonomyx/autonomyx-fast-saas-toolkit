import { Router } from "express";
import type { Pool } from "pg";

export function healthRouter(db: Pool, redis: any): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const checks: Record<string, { status: string; latencyMs: number; error?: string }> = {};

    const pgStart = performance.now();
    try {
      await db.query("SELECT 1");
      checks.postgres = { status: "healthy", latencyMs: Math.round(performance.now() - pgStart) };
    } catch (err: any) {
      checks.postgres = { status: "unhealthy", latencyMs: Math.round(performance.now() - pgStart), error: err.message };
    }

    const redisStart = performance.now();
    try {
      await redis.ping();
      checks.redis = { status: "healthy", latencyMs: Math.round(performance.now() - redisStart) };
    } catch (err: any) {
      checks.redis = { status: "unhealthy", latencyMs: Math.round(performance.now() - redisStart), error: err.message };
    }

    const allHealthy = Object.values(checks).every(c => c.status === "healthy");
    res.status(allHealthy ? 200 : 503).json({
      data: { status: allHealthy ? "healthy" : "degraded", timestamp: new Date().toISOString(), services: checks },
      error: null,
    });
  });

  return router;
}
