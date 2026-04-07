import { Router } from "express";
import type { Pool } from "pg";
import { success, notFound, badRequest, forbidden } from "../helpers/response.js";
import type { AuthenticatedRequest } from "../types.js";

const VALID_ROLES = ["owner", "admin", "member", "viewer"];

export function membersRouter(db: Pool) {
  const router = Router({ mergeParams: true }); // Access :tenantId from parent

  // GET /api/v1/tenants/:tenantId/members — list members
  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId } = req.params;
      const result = await db.query(
        `SELECT u.id, u.email, u.name, u.avatar_url, tm.role, tm.created_at as joined_at
         FROM tenant_memberships tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.tenant_id = $1
         ORDER BY tm.created_at`,
        [tenantId]
      );
      success(res, { data: result.rows });
    } catch (err) { next(err); }
  });

  // POST /api/v1/tenants/:tenantId/members — add member
  router.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId } = req.params;
      const { user_id, role = "member" } = req.body;
      if (!user_id) return badRequest(res, "user_id is required");
      if (!VALID_ROLES.includes(role)) return badRequest(res, `Invalid role. Must be: ${VALID_ROLES.join(", ")}`);

      const result = await db.query(
        `INSERT INTO tenant_memberships (tenant_id, user_id, role, invited_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [tenantId, user_id, role, req.auth?.userId || null]
      );
      success(res, { data: result.rows[0], status: 201 });
    } catch (err: any) {
      if (err.constraint) return badRequest(res, "User is already a member of this tenant");
      next(err);
    }
  });

  // PATCH /api/v1/tenants/:tenantId/members/:userId — change role
  router.patch("/:userId", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId, userId } = req.params;
      const { role } = req.body;
      if (!role || !VALID_ROLES.includes(role)) return badRequest(res, `Invalid role. Must be: ${VALID_ROLES.join(", ")}`);

      const result = await db.query(
        `UPDATE tenant_memberships SET role = $1, updated_at = NOW()
         WHERE tenant_id = $2 AND user_id = $3 RETURNING *`,
        [role, tenantId, userId]
      );
      if (result.rows.length === 0) return notFound(res, "Membership");
      success(res, { data: result.rows[0] });
    } catch (err) { next(err); }
  });

  // DELETE /api/v1/tenants/:tenantId/members/:userId — remove member
  router.delete("/:userId", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId, userId } = req.params;
      const result = await db.query(
        "DELETE FROM tenant_memberships WHERE tenant_id = $1 AND user_id = $2 RETURNING *",
        [tenantId, userId]
      );
      if (result.rows.length === 0) return notFound(res, "Membership");
      success(res, { data: { removed: true } });
    } catch (err) { next(err); }
  });

  return router;
}
