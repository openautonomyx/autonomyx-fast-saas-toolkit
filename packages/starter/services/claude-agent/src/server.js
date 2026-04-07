/**
 * Claude Agent Runner — HTTP API for triggering Claude Code tasks.
 *
 * Endpoints:
 *   POST /run       — Start a new agent job
 *   GET  /jobs/:id  — Get job status and result
 *   GET  /health    — Health check
 *
 * Auth: Bearer token via CLAUDE_AGENT_API_KEY
 */

import express from "express";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3100;
const API_KEY = process.env.CLAUDE_AGENT_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// In-memory job store (replace with Redis/DB for production)
const jobs = new Map();

// ── Auth middleware ──────────────────────────
function auth(req, res, next) {
  if (!API_KEY) return next(); // No key = no auth required (dev mode)

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

// ── Health check ────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    jobs: {
      total: jobs.size,
      running: [...jobs.values()].filter(j => j.status === "running").length,
    },
    anthropic_key_set: !!ANTHROPIC_API_KEY,
  });
});

// ── Start a job ─────────────────────────────
app.post("/run", auth, (req, res) => {
  const { prompt, workdir = "/workspace", timeout = 300000, max_turns = 25 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const jobId = randomUUID();
  const job = {
    id: jobId,
    status: "running",
    prompt,
    workdir,
    startedAt: new Date().toISOString(),
    completedAt: null,
    result: null,
    error: null,
    output: "",
  };

  jobs.set(jobId, job);

  // Spawn claude CLI as child process
  const child = spawn("claude", [
    "-p", prompt,
    "--output-format", "json",
    "--max-turns", String(max_turns),
    "--verbose",
  ], {
    cwd: workdir,
    env: {
      ...process.env,
      ANTHROPIC_API_KEY,
    },
    timeout,
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (data) => {
    stdout += data.toString();
    job.output = stdout;
  });

  child.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  child.on("close", (code) => {
    job.completedAt = new Date().toISOString();

    if (code === 0) {
      job.status = "completed";
      try {
        job.result = JSON.parse(stdout);
      } catch {
        job.result = { raw: stdout };
      }
    } else {
      job.status = "failed";
      job.error = stderr || `Process exited with code ${code}`;
    }
  });

  child.on("error", (err) => {
    job.status = "failed";
    job.error = err.message;
    job.completedAt = new Date().toISOString();
  });

  res.status(202).json({
    data: { jobId, status: "running", prompt },
    error: null,
  });
});

// ── Get job status ──────────────────────────
app.get("/jobs/:id", auth, (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({
    data: {
      id: job.id,
      status: job.status,
      prompt: job.prompt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
    },
    error: null,
  });
});

// ── List jobs ───────────────────────────────
app.get("/jobs", auth, (_req, res) => {
  const jobList = [...jobs.values()].map(j => ({
    id: j.id,
    status: j.status,
    prompt: j.prompt.slice(0, 100),
    startedAt: j.startedAt,
    completedAt: j.completedAt,
  }));

  res.json({ data: jobList, error: null });
});

// ── Start server ────────────────────────────
app.listen(PORT, () => {
  console.log(`Claude Agent Runner listening on port ${PORT}`);
  console.log(`Anthropic API key: ${ANTHROPIC_API_KEY ? "configured" : "NOT SET"}`);
});
