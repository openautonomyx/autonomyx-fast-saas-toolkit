import { Router } from "express";
import type { Pool } from "pg";
import { success, badRequest } from "../helpers/response.js";
import { parsePagination } from "../helpers/pagination.js";
import type { AuthenticatedRequest } from "../types.js";

export function usageRouter(db: Pool) {
  const router = Router({ mergeParams: true });

  // GET /api/v1/tenants/:tenantId/usage — usage summary
  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId } = req.params;
      const period = (req.query.period as string) || "30d";

      let interval: string;
      switch (period) {
        case "7d": interval = "7 days"; break;
        case "30d": interval = "30 days"; break;
        case "90d": interval = "90 days"; break;
        default: interval = "30 days";
      }

      const result = await db.query(
        `SELECT event_type,
                DATE_TRUNC('day', timestamp) as day,
                COUNT(*) as count
         FROM usage_events
         WHERE tenant_id = $1 AND timestamp > NOW() - INTERVAL '${interval}'
         GROUP BY event_type, DATE_TRUNC('day', timestamp)
         ORDER BY day DESC`,
        [tenantId]
      );

      // Also get totals
      const totals = await db.query(
        `SELECT event_type, COUNT(*) as total
         FROM usage_events
         WHERE tenant_id = $1 AND timestamp > NOW() - INTERVAL '${interval}'
         GROUP BY event_type`,
        [tenantId]
      );

      success(res, {
        data: {
          period,
          totals: totals.rows,
          daily: result.rows,
        },
      });
    } catch (err) { next(err); }
  });

  // GET /api/v1/tenants/:tenantId/usage/events — raw events
  router.get("/events", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId } = req.params;
      const { page, limit, offset } = parsePagination(req);
      const conditions = ["tenant_id = $1"];
      const params: any[] = [tenantId];
      let idx = 2;

      if (req.query.type) { conditions.push(`event_type = $${idx++}`); params.push(req.query.type); }
      if (req.query.from) { conditions.push(`timestamp >= $${idx++}`); params.push(req.query.from); }
      if (req.query.to) { conditions.push(`timestamp <= $${idx++}`); params.push(req.query.to); }

      const where = `WHERE ${conditions.join(" AND ")}`;

      const countResult = await db.query(`SELECT COUNT(*) FROM usage_events ${where}`, params);
      const total = parseInt(countResult.rows[0].count);

      const dataResult = await db.query(
        `SELECT * FROM usage_events ${where} ORDER BY timestamp DESC LIMIT $${idx++} OFFSET $${idx}`,
        [...params, limit, offset]
      );

      success(res, { data: dataResult.rows, meta: { page, limit, total } });
    } catch (err) { next(err); }
  });

  return router;
}
