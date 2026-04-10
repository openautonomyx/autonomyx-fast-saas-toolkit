import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export type JobStatus = "queued" | "running" | "done" | "failed" | "timeout";

export interface Job {
  id: string;
  status: JobStatus;
  prompt: string;
  workdir: string;
  timeout_ms: number;
  max_turns: number;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

const dbPath = process.env.JOBS_DB_PATH || "/data/jobs.db";
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'queued',
    prompt TEXT NOT NULL,
    workdir TEXT NOT NULL,
    timeout_ms INTEGER NOT NULL DEFAULT 1800000,
    max_turns INTEGER NOT NULL DEFAULT 50,
    stdout TEXT NOT NULL DEFAULT '',
    stderr TEXT NOT NULL DEFAULT '',
    exit_code INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    started_at TEXT,
    finished_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
`);

export function createJob(params: {
  prompt: string;
  workdir: string;
  timeout_ms?: number;
  max_turns?: number;
}): Job {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO jobs (id, prompt, workdir, timeout_ms, max_turns)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, params.prompt, params.workdir, params.timeout_ms ?? 1800000, params.max_turns ?? 50);
  return getJob(id)!;
}

export function getJob(id: string): Job | null {
  const row = db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as Job | undefined;
  return row ?? null;
}

export function listJobs(limit = 100): Job[] {
  return db
    .prepare(`SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as Job[];
}

export function updateJob(id: string, patch: Partial<Job>): void {
  const fields: string[] = [];
  const values: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (k === "id") continue;
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE jobs SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function appendStdout(id: string, chunk: string): void {
  db.prepare(`UPDATE jobs SET stdout = stdout || ? WHERE id = ?`).run(chunk, id);
}

export function appendStderr(id: string, chunk: string): void {
  db.prepare(`UPDATE jobs SET stderr = stderr || ? WHERE id = ?`).run(chunk, id);
}

export function countRunning(): number {
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM jobs WHERE status IN ('queued','running')`)
    .get() as { c: number };
  return row.c;
}
