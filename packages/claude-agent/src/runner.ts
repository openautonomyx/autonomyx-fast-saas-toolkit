import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import {
  appendStderr,
  appendStdout,
  getJob,
  updateJob,
  type Job,
} from "./jobs.js";

/**
 * Executes a Claude Code CLI job asynchronously.
 *
 * Uses spawn (not exec) so no shell is invoked — the prompt is passed
 * via stdin, eliminating any possibility of shell injection regardless
 * of prompt contents.
 */
export function runJob(jobId: string): void {
  const job = getJob(jobId);
  if (!job) return;

  // Ensure workdir exists
  if (!existsSync(job.workdir)) {
    mkdirSync(job.workdir, { recursive: true });
  }

  updateJob(jobId, {
    status: "running",
    started_at: new Date().toISOString(),
  });

  // Build argv for claude CLI. No shell interpolation — all values are separate args.
  const args = [
    "--print",
    "--permission-mode",
    "acceptEdits",
    "--max-turns",
    String(job.max_turns),
  ];

  const child = spawn("claude", args, {
    cwd: job.workdir,
    env: {
      ...process.env,
      // Pass through API key if set (claude CLI reads ANTHROPIC_API_KEY)
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Feed the prompt via stdin so it's never interpreted as shell.
  child.stdin.write(job.prompt);
  child.stdin.end();

  child.stdout.on("data", (chunk: Buffer) => {
    appendStdout(jobId, chunk.toString("utf8"));
  });

  child.stderr.on("data", (chunk: Buffer) => {
    appendStderr(jobId, chunk.toString("utf8"));
  });

  // Timeout handling
  const timeoutHandle = setTimeout(() => {
    child.kill("SIGTERM");
    updateJob(jobId, {
      status: "timeout",
      finished_at: new Date().toISOString(),
      exit_code: -1,
    });
  }, job.timeout_ms);

  child.on("close", (code) => {
    clearTimeout(timeoutHandle);
    const current = getJob(jobId);
    if (current?.status === "timeout") return; // already marked
    updateJob(jobId, {
      status: code === 0 ? "done" : "failed",
      finished_at: new Date().toISOString(),
      exit_code: code ?? -1,
    });
  });

  child.on("error", (err) => {
    clearTimeout(timeoutHandle);
    appendStderr(jobId, `\n[runner] spawn error: ${err.message}\n`);
    updateJob(jobId, {
      status: "failed",
      finished_at: new Date().toISOString(),
      exit_code: -1,
    });
  });
}
