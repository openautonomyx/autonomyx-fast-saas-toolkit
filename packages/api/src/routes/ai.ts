/**
 * AI service proxy routes.
 * Provides a unified API surface for Ollama, Langflow, Claude Agent, and Langfuse.
 * Each proxies to the internal Docker service — no separate auth needed.
 */

import { Router } from "express";
import { success, badRequest } from "../helpers/response.js";
import type { AuthenticatedRequest } from "../types.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434";
const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://langflow:7860";
const CLAUDE_AGENT_URL = process.env.CLAUDE_AGENT_URL || "http://claude-agent:3100";
const LANGFUSE_URL = process.env.LANGFUSE_URL || "http://langfuse:3000";

async function proxy(url: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...((opts?.headers as Record<string, string>) || {}) },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export function aiRouter(): Router {
  const router = Router();

  // ── Ollama ──────────────────────────────────

  router.get("/ollama/models", async (_req, res, next) => {
    try {
      const data = await proxy(`${OLLAMA_URL}/api/tags`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.post("/ollama/pull", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { model } = req.body;
      if (!model) return badRequest(res, "model is required");
      const data = await proxy(`${OLLAMA_URL}/api/pull`, {
        method: "POST",
        body: JSON.stringify({ name: model, stream: false }),
      });
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.post("/ollama/generate", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { model, prompt, system, options } = req.body;
      if (!model || !prompt) return badRequest(res, "model and prompt are required");
      const data = await proxy(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        body: JSON.stringify({ model, prompt, system, options, stream: false }),
      });
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.post("/ollama/chat", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { model, messages, options } = req.body;
      if (!model || !messages) return badRequest(res, "model and messages are required");
      const data = await proxy(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        body: JSON.stringify({ model, messages, options, stream: false }),
      });
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.delete("/ollama/models/:name", async (req, res, next) => {
    try {
      const data = await proxy(`${OLLAMA_URL}/api/delete`, {
        method: "DELETE",
        body: JSON.stringify({ name: req.params.name }),
      });
      success(res, { data });
    } catch (err) { next(err); }
  });

  // ── Langflow ────────────────────────────────

  router.get("/langflow/flows", async (_req, res, next) => {
    try {
      const data = await proxy(`${LANGFLOW_URL}/api/v1/flows/`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.get("/langflow/flows/:id", async (req, res, next) => {
    try {
      const data = await proxy(`${LANGFLOW_URL}/api/v1/flows/${req.params.id}`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.post("/langflow/flows/:id/run", async (req, res, next) => {
    try {
      const data = await proxy(`${LANGFLOW_URL}/api/v1/run/${req.params.id}`, {
        method: "POST",
        body: JSON.stringify(req.body),
      });
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.get("/langflow/components", async (_req, res, next) => {
    try {
      const data = await proxy(`${LANGFLOW_URL}/api/v1/all`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // ── Claude Agent ────────────────────────────

  router.post("/claude/run", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { prompt, workdir, timeout, max_turns } = req.body;
      if (!prompt) return badRequest(res, "prompt is required");
      const agentKey = process.env.CLAUDE_AGENT_API_KEY;
      const data = await proxy(`${CLAUDE_AGENT_URL}/run`, {
        method: "POST",
        headers: agentKey ? { Authorization: `Bearer ${agentKey}` } : {},
        body: JSON.stringify({ prompt, workdir, timeout, max_turns }),
      });
      success(res, { data, status: 202 });
    } catch (err) { next(err); }
  });

  router.get("/claude/jobs/:id", async (req, res, next) => {
    try {
      const agentKey = process.env.CLAUDE_AGENT_API_KEY;
      const data = await proxy(`${CLAUDE_AGENT_URL}/jobs/${req.params.id}`, {
        headers: agentKey ? { Authorization: `Bearer ${agentKey}` } : {},
      });
      success(res, { data });
    } catch (err) { next(err); }
  });

  router.get("/claude/jobs", async (_req, res, next) => {
    try {
      const agentKey = process.env.CLAUDE_AGENT_API_KEY;
      const data = await proxy(`${CLAUDE_AGENT_URL}/jobs`, {
        headers: agentKey ? { Authorization: `Bearer ${agentKey}` } : {},
      });
      success(res, { data });
    } catch (err) { next(err); }
  });

  // ── Langfuse ────────────────────────────────

  router.get("/langfuse/health", async (_req, res, next) => {
    try {
      const data = await proxy(`${LANGFUSE_URL}/api/public/health`);
      success(res, { data });
    } catch (err) { next(err); }
  });

  // ── AI Health Overview ──────────────────────

  router.get("/health", async (_req, res) => {
    const checks: Record<string, { status: string; latencyMs: number }> = {};

    for (const [name, url] of Object.entries({
      ollama: `${OLLAMA_URL}/`,
      langflow: `${LANGFLOW_URL}/health`,
      "claude-agent": `${CLAUDE_AGENT_URL}/health`,
      langfuse: `${LANGFUSE_URL}/api/public/health`,
    })) {
      const start = performance.now();
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        checks[name] = { status: r.ok || r.status === 403 ? "healthy" : "unhealthy", latencyMs: Math.round(performance.now() - start) };
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
