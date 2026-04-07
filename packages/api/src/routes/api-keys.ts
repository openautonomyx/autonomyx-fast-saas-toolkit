import { Router } from "express";
import type { Pool } from "pg";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { success, notFound, badRequest } from "../helpers/response.js";
import type { AuthenticatedRequest } from "../types.js";

export function apiKeysRouter(db: Pool) {
  const router = Router({ mergeParams: true });

  // POST /api/v1/tenants/:tenantId/api-keys — create API key
  router.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId } = req.params;
      const { name, scopes = ["read"], expires_at } = req.body;
      if (!name) return badRequest(res, "name is required");

      // Generate key: sk_ + 32 random hex bytes
      const rawKey = `sk_${randomBytes(32).toString("hex")}`;
      const keyPrefix = rawKey.slice(0, 11); // "sk_" + first 8 hex chars
      const keyHash = await bcrypt.hash(rawKey, 10);

      const result = await db.query(
        `INSERT INTO api_keys (tenant_id, created_by, name, key_prefix, key_hash, scopes, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, tenant_id, name, key_prefix, scopes, expires_at, created_at`,
        [tenantId, req.auth?.userId || null, name, keyPrefix, keyHash, JSON.stringify(scopes), expires_at || null]
      );

      // Return the full key ONCE — it's never stored or retrievable again
      success(res, {
        data: { ...result.rows[0], key: rawKey },
        status: 201,
      });
    } catch (err) { next(err); }
  });

  // GET /api/v1/tenants/:tenantId/api-keys — list keys (without secrets)
  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId } = req.params;
      const result = await db.query(
        `SELECT id, tenant_id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at
         FROM api_keys WHERE tenant_id = $1 AND revoked_at IS NULL
         ORDER BY created_at DESC`,
        [tenantId]
      );
      success(res, { data: result.rows });
    } catch (err) { next(err); }
  });

  // DELETE /api/v1/tenants/:tenantId/api-keys/:keyId — revoke key
  router.delete("/:keyId", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tenantId, keyId } = req.params;
      const result = await db.query(
        "UPDATE api_keys SET revoked_at = NOW() WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL RETURNING id, name",
        [keyId, tenantId]
      );
      if (result.rows.length === 0) return notFound(res, "API key");
      success(res, { data: { revoked: true, ...result.rows[0] } });
    } catch (err) { next(err); }
  });

  return router;
}
