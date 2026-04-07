import { Router } from "express";
import type { Pool } from "pg";
import { success, notFound, badRequest, forbidden } from "../helpers/response.js";
import { parsePagination } from "../helpers/pagination.js";
import type { AuthenticatedRequest } from "../types.js";

const VALID_PLANS = ["free", "starter", "pro", "enterprise"];
const VALID_STATUSES = ["active", "suspended", "cancelled", "trial"];

export function tenantsRouter(db: Pool) {
  const router = Router();

  // POST /api/v1/tenants — create tenant
  router.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { name, slug, plan = "free", settings = {}, metadata = {} } = req.body;
      if (!name || !slug) return badRequest(res, "name and slug are required");
      if (!VALID_PLANS.includes(plan)) return badRequest(res, `Invalid plan. Must be: ${VALID_PLANS.join(", ")}`);

      const result = await db.query(
        `INSERT INTO tenants (name, slug, plan, settings, metadata)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, slug, plan, JSON.stringify(settings), JSON.stringify(metadata)]
      );
      const tenant = result.rows[0];

      // Auto-add creator as owner
      if (req.auth?.userId && req.auth.userId !== "platform") {
        await db.query(
          `INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES ($1, $2, 'owner')
           ON CONFLICT (tenant_id, user_id) DO NOTHING`,
          [tenant.id, req.auth.userId]
        );
      }

      success(res, { data: tenant, status: 201 });
    } catch (err: any) {
      if (err.constraint === "tenants_slug_key") return badRequest(res, "Slug already taken");
      next(err);
    }
  });

  // GET /api/v1/tenants — list tenants
  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { page, limit, offset } = parsePagination(req);
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (req.query.status) { conditions.push(`t.status = $${paramIdx++}`); params.push(req.query.status); }
      if (req.query.plan) { conditions.push(`t.plan = $${paramIdx++}`); params.push(req.query.plan); }

      // Non-platform users can only see tenants they belong to
      if (!req.auth?.isPlatformKey) {
        conditions.push(`EXISTS (SELECT 1 FROM tenant_memberships tm WHERE tm.tenant_id = t.id AND tm.user_id = $${paramIdx++})`);
        params.push(req.auth?.userId);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const countResult = await db.query(`SELECT COUNT(*) FROM tenants t ${where}`, params);
      const total = parseInt(countResult.rows[0].count);

      const dataResult = await db.query(
        `SELECT t.* FROM tenants t ${where} ORDER BY t.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
        [...params, limit, offset]
      );

      success(res, { data: dataResult.rows, meta: { page, limit, total } });
    } catch (err) { next(err); }
  });

  // GET /api/v1/tenants/:id — get tenant
  router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await db.query("SELECT * FROM tenants WHERE id = $1", [req.params.id]);
      if (result.rows.length === 0) return notFound(res, "Tenant");
      success(res, { data: result.rows[0] });
    } catch (err) { next(err); }
  });

  // PATCH /api/v1/tenants/:id — update tenant
  router.patch("/:id", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { name, settings, metadata } = req.body;
      const sets: string[] = ["updated_at = NOW()"];
      const params: any[] = [];
      let idx = 1;

      if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name); }
      if (settings !== undefined) { sets.push(`settings = $${idx++}`); params.push(JSON.stringify(settings)); }
      if (metadata !== undefined) { sets.push(`metadata = $${idx++}`); params.push(JSON.stringify(metadata)); }

      params.push(req.params.id);
      const result = await db.query(
        `UPDATE tenants SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, params
      );
      if (result.rows.length === 0) return notFound(res, "Tenant");
      success(res, { data: result.rows[0] });
    } catch (err) { next(err); }
  });

  // DELETE /api/v1/tenants/:id — soft-delete
  router.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await db.query(
        "UPDATE tenants SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
        [req.params.id]
      );
      if (result.rows.length === 0) return notFound(res, "Tenant");
      success(res, { data: result.rows[0] });
    } catch (err) { next(err); }
  });

  // POST /api/v1/tenants/:id/change-plan — change plan
  router.post("/:id/change-plan", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { plan } = req.body;
      if (!plan || !VALID_PLANS.includes(plan)) return badRequest(res, `Invalid plan. Must be: ${VALID_PLANS.join(", ")}`);

      const result = await db.query(
        "UPDATE tenants SET plan = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [plan, req.params.id]
      );
      if (result.rows.length === 0) return notFound(res, "Tenant");
      success(res, { data: result.rows[0] });
    } catch (err) { next(err); }
  });

  return router;
}
