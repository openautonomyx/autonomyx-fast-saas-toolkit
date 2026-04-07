import { Router } from "express";
import type { Pool } from "pg";
import { success, forbidden } from "../helpers/response.js";
import type { AuthenticatedRequest } from "../types.js";

export function adminRouter(db: Pool) {
  const router = Router();

  // Admin-only middleware
  router.use((req: AuthenticatedRequest, res, next) => {
    if (!req.auth?.isPlatformKey && !req.auth?.scopes?.includes("admin")) {
      return forbidden(res, "Admin access required");
    }
    next();
  });

  // GET /api/v1/admin/stats — platform-wide statistics
  router.get("/stats", async (_req, res, next) => {
    try {
      const [tenants, users, memberships, apiKeys, events] = await Promise.all([
        db.query("SELECT plan, status, COUNT(*) as count FROM tenants GROUP BY plan, status"),
        db.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE email_verified) as verified FROM users"),
        db.query("SELECT role, COUNT(*) as count FROM tenant_memberships GROUP BY role"),
        db.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE revoked_at IS NULL) as active FROM api_keys"),
        db.query(`SELECT event_type, COUNT(*) as count FROM usage_events
                  WHERE timestamp > NOW() - INTERVAL '30 days' GROUP BY event_type`),
      ]);

      success(res, {
        data: {
          tenants: tenants.rows,
          users: users.rows[0],
          memberships: memberships.rows,
          api_keys: apiKeys.rows[0],
          usage_last_30d: events.rows,
        },
      });
    } catch (err) { next(err); }
  });

  // GET /api/v1/admin/modules — list toolkit modules
  router.get("/modules", async (_req, res) => {
    // Static module list — matches the CLI registry
    const modules = [
      { id: "postgres", name: "PostgreSQL", group: "essential", status: "always_on" },
      { id: "redis", name: "Redis", group: "essential", status: "always_on" },
      { id: "caddy", name: "Caddy", group: "essential", status: "always_on" },
      { id: "logto", name: "Logto", group: "core", subdomain: "auth" },
      { id: "lago", name: "Lago", group: "core", subdomain: "billing" },
      { id: "rustfs", name: "RustFS", group: "core", subdomain: "storage" },
      { id: "glitchtip", name: "GlitchTip", group: "ops", subdomain: "errors" },
      { id: "uptime-kuma", name: "Uptime Kuma", group: "ops", subdomain: "status" },
      { id: "grafana-stack", name: "Grafana Stack", group: "ops", subdomain: "monitor" },
      { id: "matomo", name: "Matomo", group: "growth", subdomain: "analytics" },
      { id: "mautic", name: "Mautic", group: "growth", subdomain: "email" },
      { id: "stalwart", name: "Stalwart", group: "growth" },
      { id: "nocodb", name: "NocoDB", group: "growth", subdomain: "admin" },
      { id: "n8n", name: "n8n", group: "growth", subdomain: "auto" },
      { id: "appsmith", name: "Appsmith", group: "growth", subdomain: "tools" },
      { id: "docmost", name: "Docmost", group: "growth", subdomain: "docs" },
      { id: "posthog", name: "PostHog", group: "growth", subdomain: "product" },
      { id: "saas-api", name: "SaaS API", group: "core", subdomain: "api" },
    ];
    success(res, { data: modules });
  });

  return router;
}
