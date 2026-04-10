/**
 * Growth service proxy routes — Appsmith, Docmost, PostHog.
 * Provides a unified API surface so the MCP server and dashboard
 * can manage these services through a single auth boundary.
 */

import { Router } from "express";
import { success, badRequest } from "../helpers/response.js";
import type { AuthenticatedRequest } from "../types.js";

const APPSMITH_URL = process.env.APPSMITH_URL || "http://appsmith:80";
const DOCMOST_URL = process.env.DOCMOST_URL || "http://docmost:3000";
const POSTHOG_URL = process.env.POSTHOG_URL || "http://posthog:8000";

async function proxy(url: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...((opts?.headers as Record<string, string>) || {}) },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export function servicesRouter(): Router {
  const router = Router();

  // ══════════════════════════════════════════════
  // APPSMITH — Low-code internal tool builder
  // ══════════════════════════════════════════════

  // List all applications
  router.get("/appsmith/applications", async (_req, res, next) => {
    try {
      const data = await proxy(`${APPSMITH_URL}/api/v1/applications`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // Get a specific application
  router.get("/appsmith/applications/:id", async (req, res, next) => {
    try {
      const data = await proxy(`${APPSMITH_URL}/api/v1/applications/${req.params.id}`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // List pages in an application
  router.get("/appsmith/applications/:id/pages", async (req, res, next) => {
    try {
      const data = await proxy(`${APPSMITH_URL}/api/v1/pages?applicationId=${req.params.id}`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // List datasources
  router.get("/appsmith/datasources", async (_req, res, next) => {
    try {
      const data = await proxy(`${APPSMITH_URL}/api/v1/datasources`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // ══════════════════════════════════════════════
  // DOCMOST — Knowledge base & documentation
  // ══════════════════════════════════════════════

  // List workspaces
  router.get("/docmost/workspaces", async (_req, res, next) => {
    try {
      const data = await proxy(`${DOCMOST_URL}/api/workspaces`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // List pages in a space
  router.get("/docmost/spaces/:spaceId/pages", async (req, res, next) => {
    try {
      const data = await proxy(`${DOCMOST_URL}/api/pages?spaceId=${req.params.spaceId}`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // Get a specific page
  router.get("/docmost/pages/:id", async (req, res, next) => {
    try {
      const data = await proxy(`${DOCMOST_URL}/api/pages/${req.params.id}`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // Create a page
  router.post("/docmost/pages", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { title, content, spaceId } = req.body;
      if (!title || !spaceId) return badRequest(res, "title and spaceId are required");
      const data = await proxy(`${DOCMOST_URL}/api/pages`, {
        method: "POST",
        body: JSON.stringify({ title, content, spaceId }),
      });
      success(res, { data, status: 201 });
    } catch (err) { next(err); }
  });

  // ══════════════════════════════════════════════
  // POSTHOG — Product analytics & feature flags
  // ══════════════════════════════════════════════

  // List feature flags
  router.get("/posthog/feature-flags", async (_req, res, next) => {
    try {
      const key = process.env.POSTHOG_API_KEY;
      const headers: Record<string, string> = {};
      if (key) headers["Authorization"] = `Bearer ${key}`;
      const data = await proxy(`${POSTHOG_URL}/api/projects/@current/feature_flags/`, { headers });
      success(res, { data });
    } catch (err) { next(err); }
  });

  // Get insights (dashboard queries)
  router.get("/posthog/insights", async (req, res, next) => {
    try {
      const key = process.env.POSTHOG_API_KEY;
      const headers: Record<string, string> = {};
      if (key) headers["Authorization"] = `Bearer ${key}`;
      const limit = req.query.limit || "10";
      const data = await proxy(`${POSTHOG_URL}/api/projects/@current/insights/?limit=${limit}`, { headers });
      success(res, { data });
    } catch (err) { next(err); }
  });

  // List persons (users tracked by PostHog)
  router.get("/posthog/persons", async (req, res, next) => {
    try {
      const key = process.env.POSTHOG_API_KEY;
      const headers: Record<string, string> = {};
      if (key) headers["Authorization"] = `Bearer ${key}`;
      const search = req.query.search ? `&search=${req.query.search}` : "";
      const data = await proxy(`${POSTHOG_URL}/api/projects/@current/persons/?limit=20${search}`, { headers });
      success(res, { data });
    } catch (err) { next(err); }
  });

  // List events
  router.get("/posthog/events", async (req, res, next) => {
    try {
      const key = process.env.POSTHOG_API_KEY;
      const headers: Record<string, string> = {};
      if (key) headers["Authorization"] = `Bearer ${key}`;
      const limit = req.query.limit || "20";
      const event = req.query.event ? `&event=${req.query.event}` : "";
      const data = await proxy(`${POSTHOG_URL}/api/projects/@current/events/?limit=${limit}${event}`, { headers });
      success(res, { data });
    } catch (err) { next(err); }
  });

  // ══════════════════════════════════════════════
  // Health check for all three
  // ══════════════════════════════════════════════

  router.get("/health", async (_req, res) => {
    const checks: Record<string, { status: string; latencyMs: number }> = {};

    for (const [name, url] of Object.entries({
      appsmith: `${APPSMITH_URL}/api/v1/users/me`,
      docmost: `${DOCMOST_URL}/api/health`,
      posthog: `${POSTHOG_URL}/_health`,
    })) {
      const start = performance.now();
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        checks[name] = { status: r.ok || r.status === 401 || r.status === 403 ? "healthy" : "unhealthy", latencyMs: Math.round(performance.now() - start) };
      } catch {
        checks[name] = { status: "unreachable", latencyMs: Math.round(performance.now() - start) };
      }
    }

    const allUp = Object.values(checks).every(c => c.status === "healthy");
    res.status(allUp ? 200 : 503).json({
      data: { status: allUp ? "healthy" : "degraded", services: checks },
      error: null,
    });
  });

  return router;
}
