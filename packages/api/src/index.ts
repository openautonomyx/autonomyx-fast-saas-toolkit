#!/usr/bin/env node
/**
 * Autonomyx Fast SaaS Toolkit — REST API Server
 *
 * Express server that manages tenants, users, memberships, API keys,
 * and usage data. Reuses @autonomyx/saas-middleware for auth, tenant
 * context, rate limiting, and usage tracking.
 */

import express from "express";
import cors from "cors";
import db from "./db.js";
import redis from "./redis.js";
import { healthRouter } from "./routes/health.js";
import { plansRouter } from "./routes/plans.js";
import { tenantsRouter } from "./routes/tenants.js";
import { usersRouter } from "./routes/users.js";
import { membersRouter } from "./routes/members.js";
import { apiKeysRouter } from "./routes/api-keys.js";
import { usageRouter } from "./routes/usage.js";
import { adminRouter } from "./routes/admin.js";

const PORT = parseInt(process.env.API_PORT || "4000");
const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || "https://auth.localhost/oidc";
const LOGTO_AUDIENCE = process.env.LOGTO_AUDIENCE || "";

const app = express();

// ── Global middleware ─────────────────────────
app.use(express.json());
app.use(cors());

// ── Public routes (no auth) ───────────────────
app.use("/health", healthRouter(db, redis));
app.use("/api/v1/plans", plansRouter());

// ── Auth middleware for protected routes ───────
// Inline lightweight JWT validation since the middleware package
// uses raw Node.js types. We validate Logto JWTs via jose.
import * as jose from "jose";

const JWKS = jose.createRemoteJWKSet(
  new URL(`${LOGTO_ENDPOINT.replace(/\/$/, "")}/jwks`)
);

app.use("/api/v1", async (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ data: null, error: { code: "UNAUTHORIZED", message: "Missing token" } });
  }

  const token = authHeader.slice(7);

  // Platform API key (pk_ prefix) — for MCP and admin access
  if (token.startsWith("pk_")) {
    req.auth = { userId: "platform", tenantId: "", email: "", scopes: ["admin"], isPlatformKey: true };
    return next();
  }

  try {
    const verifyOpts: jose.JWTVerifyOptions = { issuer: LOGTO_ENDPOINT.replace(/\/oidc\/?$/, "") };
    if (LOGTO_AUDIENCE) verifyOpts.audience = LOGTO_AUDIENCE;

    const { payload } = await jose.jwtVerify(token, JWKS, verifyOpts);

    req.auth = {
      userId: payload.sub || "",
      tenantId: (payload as any).organization_id || (payload as any).org_id || "",
      email: (payload as any).email || "",
      scopes: typeof payload.scope === "string" ? payload.scope.split(" ") : [],
    };
    next();
  } catch {
    return res.status(401).json({ data: null, error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
});

// ── Protected routes ──────────────────────────
app.use("/api/v1/tenants", tenantsRouter(db));
app.use("/api/v1/users", usersRouter(db));
app.use("/api/v1/tenants/:tenantId/members", membersRouter(db));
app.use("/api/v1/tenants/:tenantId/api-keys", apiKeysRouter(db));
app.use("/api/v1/tenants/:tenantId/usage", usageRouter(db));
app.use("/api/v1/admin", adminRouter(db));

// ── Error handler ─────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
});

// ── Start ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Autonomyx Fast SaaS API listening on port ${PORT}`);
});
