#!/usr/bin/env node
/**
 * Claude Agent — REST API wrapper around the Claude Code CLI.
 *
 * Accepts async job submissions, spawns `claude` as a subprocess,
 * streams stdout/stderr into a SQLite job store, and exposes GET
 * endpoints for polling.
 *
 * Auth: single bearer token via CLAUDE_AGENT_API_KEY.
 */
import express from "express";
import { createJob, getJob, listJobs, countRunning } from "./jobs.js";
import { runJob } from "./runner.js";

const PORT = parseInt(process.env.PORT || "3100", 10);
const API_KEY = process.env.CLAUDE_AGENT_API_KEY || "";
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_JOBS || "1", 10);

if (!API_KEY) {
  console.error("[claude-agent] CLAUDE_AGENT_API_KEY is required");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "1mb" }));

// Public health
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", running: countRunning() });
});

// Auth middleware for everything else
app.use((req, res, next) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ") || auth.slice(7) !== API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

// POST /run — start an async job
app.post("/run", (req, res) => {
  const { prompt, workdir, timeout, max_turns } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt is required (string)" });
  }
  const wd = workdir || process.env.SAAS_OUTPUT_DIR || "/saas-apps/default";
  if (typeof wd !== "string") {
    return res.status(400).json({ error: "workdir must be a string" });
  }
  if (countRunning() >= MAX_CONCURRENT) {
    return res.status(429).json({
      error: `max concurrent jobs reached (${MAX_CONCURRENT}). Poll existing jobs first.`,
    });
  }
  const job = createJob({
    prompt,
    workdir: wd,
    timeout_ms: typeof timeout === "number" ? timeout : undefined,
    max_turns: typeof max_turns === "number" ? max_turns : undefined,
  });
  // Kick off async — runJob uses child_process internally and returns immediately
  setImmediate(() => runJob(job.id));
  res.status(202).json({
    id: job.id,
    status: job.status,
    workdir: job.workdir,
  });
});

// GET /jobs — list recent jobs
app.get("/jobs", (_req, res) => {
  res.json(listJobs(100));
});

// GET /jobs/:id — get one job
app.get("/jobs/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json(job);
});

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[claude-agent] error:", err);
    res.status(500).json({ error: "internal error", message: err.message });
  }
);

app.listen(PORT, () => {
  console.log(`[claude-agent] listening on port ${PORT} (max concurrent: ${MAX_CONCURRENT})`);
});
