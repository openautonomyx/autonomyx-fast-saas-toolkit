import type { Pool } from "pg";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
}

export interface TenantContext {
  tenant: Tenant;
  userId: string;
  role: string;
}

interface TenantContextOptions {
  db: Pool;
  headerName?: string;
}

/**
 * Middleware that resolves the current tenant from the authenticated user's JWT claims.
 * Expects auth-guard to have run first, setting `req.auth.tenantId`.
 *
 * Attaches `req.tenantContext` with full tenant info and user's role.
 */
export function createTenantContext(options: TenantContextOptions) {
  const { db, headerName = "x-tenant-id" } = options;

  return async (req: IncomingMessage & { auth?: any; tenantContext?: TenantContext }, res: ServerResponse, next: (err?: Error) => void) => {
    try {
      // Tenant ID comes from JWT claim or header override
      const tenantId = req.auth?.tenantId || (req.headers[headerName] as string);

      if (!tenantId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing tenant context" }));
        return;
      }

      // Load tenant and membership in a single query
      const result = await db.query(
        `SELECT t.id, t.name, t.slug, t.plan, t.status, t.settings,
                tm.role
         FROM tenants t
         JOIN tenant_memberships tm ON tm.tenant_id = t.id
         WHERE t.id = $1 AND tm.user_id = $2 AND t.status = 'active'`,
        [tenantId, req.auth?.userId]
      );

      if (result.rows.length === 0) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Tenant not found or access denied" }));
        return;
      }

      const row = result.rows[0];
      req.tenantContext = {
        tenant: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          plan: row.plan,
          status: row.status,
          settings: row.settings,
        },
        userId: req.auth.userId,
        role: row.role,
      };

      next();
    } catch (err) {
      next(err as Error);
    }
  };
}
