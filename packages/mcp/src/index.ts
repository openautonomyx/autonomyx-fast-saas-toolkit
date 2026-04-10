#!/usr/bin/env npx tsx
/**
 * Autonomyx Fast SaaS Toolkit — MCP Server
 *
 * 30 tools for managing tenants, users, memberships, API keys,
 * usage, plans, and platform administration via the REST API.
 *
 * Follows the opensaasapps-mcps pattern exactly.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "./http-client.js";

// ── Config ────────────────────────────────────

function envRequired(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

const apiUrl = envRequired("FAST_SAAS_API_URL");
const apiKey = envRequired("FAST_SAAS_API_KEY");

const client = new HttpClient(apiUrl, apiKey);
const server = new McpServer({ name: "autonomyx-fast-saas", version: "1.0.0" });

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

// ═══════════════════════════════════════════════
// TENANT TOOLS (6)
// ═��═════════════════════════════════════════════

server.tool(
  "fast_saas_create_tenant",
  "Create a new tenant in the SaaS platform",
  {
    name: z.string().describe("Tenant display name"),
    slug: z.string().describe("URL-safe slug (unique)"),
    plan: z.enum(["free", "starter", "pro", "enterprise"]).optional().describe("Pricing plan (default: free)"),
    settings: z.record(z.unknown()).optional().describe("Tenant settings (JSON)"),
  },
  async (args) => {
    try {
      const result = await client.post("/api/v1/tenants", args);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_list_tenants",
  "List all tenants with optional filters",
  {
    status: z.enum(["active", "suspended", "cancelled", "trial"]).optional().describe("Filter by status"),
    plan: z.enum(["free", "starter", "pro", "enterprise"]).optional().describe("Filter by plan"),
    page: z.number().optional().describe("Page number"),
    limit: z.number().optional().describe("Results per page (max 100)"),
  },
  async (args) => {
    try {
      const params: Record<string, string> = {};
      if (args.status) params.status = args.status;
      if (args.plan) params.plan = args.plan;
      if (args.page) params.page = String(args.page);
      if (args.limit) params.limit = String(args.limit);
      const result = await client.get("/api/v1/tenants", params);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_get_tenant",
  "Get a specific tenant by ID",
  { tenant_id: z.string().describe("Tenant UUID") },
  async ({ tenant_id }) => {
    try {
      const result = await client.get(`/api/v1/tenants/${tenant_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_update_tenant",
  "Update a tenant's name, settings, or metadata",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    name: z.string().optional().describe("New display name"),
    settings: z.record(z.unknown()).optional().describe("New settings (replaces existing)"),
    metadata: z.record(z.unknown()).optional().describe("New metadata (replaces existing)"),
  },
  async ({ tenant_id, ...body }) => {
    try {
      const result = await client.patch(`/api/v1/tenants/${tenant_id}`, body);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_delete_tenant",
  "Soft-delete a tenant (sets status to cancelled)",
  { tenant_id: z.string().describe("Tenant UUID") },
  async ({ tenant_id }) => {
    try {
      const result = await client.delete(`/api/v1/tenants/${tenant_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_change_plan",
  "Change a tenant's pricing plan",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    plan: z.enum(["free", "starter", "pro", "enterprise"]).describe("New plan"),
  },
  async ({ tenant_id, plan }) => {
    try {
      const result = await client.post(`/api/v1/tenants/${tenant_id}/change-plan`, { plan });
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ════════════════════════���══════════════════════
// USER TOOLS (4)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_create_user",
  "Create a new user",
  {
    email: z.string().describe("Email address"),
    name: z.string().describe("Full name"),
    external_id: z.string().optional().describe("Logto user ID for linking"),
  },
  async (args) => {
    try {
      const result = await client.post("/api/v1/users", args);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_list_users",
  "List all users with optional email filter",
  {
    email: z.string().optional().describe("Filter by email (partial match)"),
    page: z.number().optional(),
    limit: z.number().optional(),
  },
  async (args) => {
    try {
      const params: Record<string, string> = {};
      if (args.email) params.email = args.email;
      if (args.page) params.page = String(args.page);
      if (args.limit) params.limit = String(args.limit);
      const result = await client.get("/api/v1/users", params);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_get_user",
  "Get a specific user by ID",
  { user_id: z.string().describe("User UUID") },
  async ({ user_id }) => {
    try {
      const result = await client.get(`/api/v1/users/${user_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_update_user",
  "Update a user's profile",
  {
    user_id: z.string().describe("User UUID"),
    name: z.string().optional().describe("New name"),
    avatar_url: z.string().optional().describe("New avatar URL"),
    email_verified: z.boolean().optional().describe("Mark email as verified"),
  },
  async ({ user_id, ...body }) => {
    try {
      const result = await client.patch(`/api/v1/users/${user_id}`, body);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ��══════════════════════════════════════════════
// MEMBER TOOLS (4)
// ══════════════════════════════════════════════��

server.tool(
  "fast_saas_list_members",
  "List all members of a tenant with their roles",
  { tenant_id: z.string().describe("Tenant UUID") },
  async ({ tenant_id }) => {
    try {
      const result = await client.get(`/api/v1/tenants/${tenant_id}/members`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_add_member",
  "Add a user to a tenant with a specific role",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    user_id: z.string().describe("User UUID to add"),
    role: z.enum(["owner", "admin", "member", "viewer"]).optional().describe("Role (default: member)"),
  },
  async ({ tenant_id, ...body }) => {
    try {
      const result = await client.post(`/api/v1/tenants/${tenant_id}/members`, body);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_update_member",
  "Change a team member's role",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    user_id: z.string().describe("User UUID"),
    role: z.enum(["owner", "admin", "member", "viewer"]).describe("New role"),
  },
  async ({ tenant_id, user_id, role }) => {
    try {
      const result = await client.patch(`/api/v1/tenants/${tenant_id}/members/${user_id}`, { role });
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_remove_member",
  "Remove a user from a tenant",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    user_id: z.string().describe("User UUID to remove"),
  },
  async ({ tenant_id, user_id }) => {
    try {
      const result = await client.delete(`/api/v1/tenants/${tenant_id}/members/${user_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ���═════════════════════��════════════════════════
// API KEY TOOLS (3)
// ══���═══════════���════════════════════════════════

server.tool(
  "fast_saas_create_api_key",
  "Create a new API key for a tenant (returns full key ONCE)",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    name: z.string().describe("Key name for identification"),
    scopes: z.array(z.string()).optional().describe("Permission scopes (default: [\"read\"])"),
    expires_at: z.string().optional().describe("Expiration date (ISO 8601)"),
  },
  async ({ tenant_id, ...body }) => {
    try {
      const result = await client.post(`/api/v1/tenants/${tenant_id}/api-keys`, body);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_list_api_keys",
  "List all active API keys for a tenant (without secrets)",
  { tenant_id: z.string().describe("Tenant UUID") },
  async ({ tenant_id }) => {
    try {
      const result = await client.get(`/api/v1/tenants/${tenant_id}/api-keys`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_revoke_api_key",
  "Revoke an API key (immediate, irreversible)",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    key_id: z.string().describe("API key UUID"),
  },
  async ({ tenant_id, key_id }) => {
    try {
      const result = await client.delete(`/api/v1/tenants/${tenant_id}/api-keys/${key_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ══════════════════════════════���════════════════
// USAGE TOOLS (2)
// ══��════════════��═══════════════════════════════

server.tool(
  "fast_saas_get_usage",
  "Get usage summary for a tenant (API calls, storage, etc.)",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
  },
  async ({ tenant_id, period }) => {
    try {
      const params: Record<string, string> = {};
      if (period) params.period = period;
      const result = await client.get(`/api/v1/tenants/${tenant_id}/usage`, params);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_get_usage_events",
  "Get raw usage events for a tenant (paginated)",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    type: z.string().optional().describe("Filter by event type"),
    from: z.string().optional().describe("Start date (ISO 8601)"),
    to: z.string().optional().describe("End date (ISO 8601)"),
    page: z.number().optional(),
    limit: z.number().optional(),
  },
  async ({ tenant_id, ...filters }) => {
    try {
      const params: Record<string, string> = {};
      if (filters.type) params.type = filters.type;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.page) params.page = String(filters.page);
      if (filters.limit) params.limit = String(filters.limit);
      const result = await client.get(`/api/v1/tenants/${tenant_id}/usage/events`, params);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════��═══════════════════════════════
// PLAN TOOLS (2)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_list_plans",
  "List all pricing plans with features and limits",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/plans");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_check_feature",
  "Check if a feature is enabled for a specific plan",
  {
    plan: z.enum(["free", "starter", "pro", "enterprise"]).describe("Plan to check"),
    feature: z.string().describe("Feature name (e.g., sso, api_access, custom_domain)"),
  },
  async ({ plan, feature }) => {
    try {
      const result = await client.get(`/api/v1/plans/${plan}/check/${feature}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════��═══════════════════
// SYSTEM TOOLS (3)
// ════���══════════════════════════════════════════

server.tool(
  "fast_saas_health",
  "Check health of the SaaS platform (PostgreSQL + Redis)",
  {},
  async () => {
    try {
      const result = await client.get("/health");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_platform_stats",
  "Get platform-wide statistics (tenants, users, usage counts)",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/admin/stats");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_list_modules",
  "List all toolkit modules and their status",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/admin/modules");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// CONVENIENCE TOOLS (6)
// ══════════════���═══════════════════════════════���

server.tool(
  "fast_saas_get_tenant_overview",
  "Get comprehensive tenant overview (tenant info + members + usage + API keys)",
  { tenant_id: z.string().describe("Tenant UUID") },
  async ({ tenant_id }) => {
    try {
      const [tenant, members, usage, keys] = await Promise.all([
        client.get(`/api/v1/tenants/${tenant_id}`),
        client.get(`/api/v1/tenants/${tenant_id}/members`),
        client.get(`/api/v1/tenants/${tenant_id}/usage`),
        client.get(`/api/v1/tenants/${tenant_id}/api-keys`),
      ]);
      return jsonResult({
        data: {
          tenant: tenant.data,
          members: members.data,
          usage: usage.data,
          api_keys: keys.data,
        },
      });
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_suspend_tenant",
  "Suspend a tenant (blocks access without deleting data)",
  { tenant_id: z.string().describe("Tenant UUID") },
  async ({ tenant_id }) => {
    try {
      const result = await client.patch(`/api/v1/tenants/${tenant_id}`, { status: "suspended" });
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_reactivate_tenant",
  "Reactivate a suspended tenant",
  { tenant_id: z.string().describe("Tenant UUID") },
  async ({ tenant_id }) => {
    try {
      const result = await client.patch(`/api/v1/tenants/${tenant_id}`, { status: "active" });
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_get_plan_limits",
  "Get full limits and features for a specific plan",
  { plan: z.enum(["free", "starter", "pro", "enterprise"]).describe("Plan name") },
  async ({ plan }) => {
    try {
      const result = await client.get("/api/v1/plans");
      const planData = result.data?.find((p: any) => p.code === plan);
      return jsonResult(planData || { error: `Plan '${plan}' not found` });
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_check_usage_limit",
  "Check if a tenant is approaching or exceeding their plan's usage limit",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    period: z.enum(["7d", "30d", "90d"]).optional().describe("Time period (default: 30d)"),
  },
  async ({ tenant_id, period }) => {
    try {
      const params: Record<string, string> = {};
      if (period) params.period = period;
      const [tenant, usage, plans] = await Promise.all([
        client.get(`/api/v1/tenants/${tenant_id}`),
        client.get(`/api/v1/tenants/${tenant_id}/usage`, params),
        client.get("/api/v1/plans"),
      ]);

      const plan = plans.data?.find((p: any) => p.code === tenant.data?.plan);
      const apiCallsTotal = usage.data?.totals?.find((t: any) => t.event_type === "api_call")?.total || 0;
      const limit = plan?.api_calls_per_month || 0;
      const usagePercent = limit > 0 ? Math.round((apiCallsTotal / limit) * 100) : 0;

      return jsonResult({
        data: {
          tenant_id,
          plan: tenant.data?.plan,
          api_calls_used: parseInt(apiCallsTotal),
          api_calls_limit: limit === -1 ? "unlimited" : limit,
          usage_percent: limit === -1 ? 0 : usagePercent,
          status: usagePercent >= 100 ? "exceeded" : usagePercent >= 80 ? "warning" : "ok",
        },
      });
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_rotate_api_key",
  "Rotate an API key (revokes old, creates new with same name and scopes)",
  {
    tenant_id: z.string().describe("Tenant UUID"),
    key_id: z.string().describe("API key UUID to rotate"),
  },
  async ({ tenant_id, key_id }) => {
    try {
      // Get existing key info
      const existingKeys = await client.get(`/api/v1/tenants/${tenant_id}/api-keys`);
      const oldKey = existingKeys.data?.find((k: any) => k.id === key_id);
      if (!oldKey) return jsonResult({ error: "API key not found" });

      // Revoke old key
      await client.delete(`/api/v1/tenants/${tenant_id}/api-keys/${key_id}`);

      // Create new key with same name and scopes
      const newKey = await client.post(`/api/v1/tenants/${tenant_id}/api-keys`, {
        name: oldKey.name,
        scopes: oldKey.scopes,
      });

      return jsonResult({
        data: {
          rotated: true,
          old_key_id: key_id,
          new_key: newKey.data,
        },
      });
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// AI TOOLS — OLLAMA (5)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_ollama_list_models",
  "List all locally available Ollama models",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/ai/ollama/models");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_ollama_pull_model",
  "Download a model from the Ollama library",
  { model: z.string().describe("Model name (e.g., llama3.2, mistral, codellama)") },
  async ({ model }) => {
    try {
      const result = await client.post("/api/v1/ai/ollama/pull", { model });
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_ollama_generate",
  "Generate a completion with a local Ollama model",
  {
    model: z.string().describe("Model name"),
    prompt: z.string().describe("Prompt text"),
    system: z.string().optional().describe("System prompt"),
  },
  async (args) => {
    try {
      const result = await client.post("/api/v1/ai/ollama/generate", args);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_ollama_chat",
  "Multi-turn chat with a local Ollama model",
  {
    model: z.string().describe("Model name"),
    messages: z.array(z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })).describe("Chat messages array"),
  },
  async (args) => {
    try {
      const result = await client.post("/api/v1/ai/ollama/chat", args);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_ollama_delete_model",
  "Delete a locally downloaded Ollama model",
  { model: z.string().describe("Model name to delete") },
  async ({ model }) => {
    try {
      const result = await client.delete(`/api/v1/ai/ollama/models/${encodeURIComponent(model)}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// AI TOOLS — LANGFLOW (4)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_langflow_list_flows",
  "List all Langflow AI workflows",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/ai/langflow/flows");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_langflow_get_flow",
  "Get details of a specific Langflow workflow",
  { flow_id: z.string().describe("Flow UUID") },
  async ({ flow_id }) => {
    try {
      const result = await client.get(`/api/v1/ai/langflow/flows/${flow_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_langflow_run_flow",
  "Execute a Langflow workflow with input data",
  {
    flow_id: z.string().describe("Flow UUID to run"),
    input_value: z.string().optional().describe("Input text for the flow"),
    tweaks: z.record(z.unknown()).optional().describe("Component tweaks (overrides)"),
  },
  async ({ flow_id, ...body }) => {
    try {
      const result = await client.post(`/api/v1/ai/langflow/flows/${flow_id}/run`, body);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_langflow_list_components",
  "List all available Langflow components (LLMs, tools, chains, etc.)",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/ai/langflow/components");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// AI TOOLS — CLAUDE AGENT (3)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_claude_run",
  "Start a Claude Code agent job (returns jobId for async polling)",
  {
    prompt: z.string().describe("Task prompt for Claude Code"),
    workdir: z.string().optional().describe("Working directory (default: /workspace)"),
    timeout: z.number().optional().describe("Timeout in ms (default: 300000)"),
    max_turns: z.number().optional().describe("Max conversation turns (default: 25)"),
  },
  async (args) => {
    try {
      const result = await client.post("/api/v1/ai/claude/run", args);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_claude_get_job",
  "Get status and result of a Claude Code agent job",
  { job_id: z.string().describe("Job UUID from fast_saas_claude_run") },
  async ({ job_id }) => {
    try {
      const result = await client.get(`/api/v1/ai/claude/jobs/${job_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_claude_list_jobs",
  "List all Claude Code agent jobs",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/ai/claude/jobs");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// OSS-TO-SAAS CONVERSION (2)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_convert_to_saas",
  "Convert an open-source GitHub repo into a multi-tenant SaaS. Runs the full oss-to-saas pipeline asynchronously and returns a job_id for polling.",
  {
    github_url: z.string().url().describe("GitHub repo URL to convert (e.g. https://github.com/owner/repo)"),
    project_name: z.string().optional().describe("Target project slug. Defaults to the repo name."),
  },
  async ({ github_url, project_name }) => {
    const slug =
      project_name ||
      github_url.replace(/\.git$/, "").split("/").pop() ||
      "saas-app";
    const workdir = `/saas-apps/${slug}`;
    const prompt = `Use the /oss-to-saas skill to convert ${github_url} into a multi-tenant SaaS.

1. Clone the repo into ${workdir} (or use an existing clone if present).
2. Run Phases 1-6 of the oss-to-saas skill in full: analysis, architecture design, code modifications, infrastructure, business layer, compliance.
3. Write a standalone docker-compose.yaml in ${workdir} that can run the generated SaaS independently (reuses shared services where available: Postgres at db:5432, Redis at redis:6379).
4. Write a README.md in ${workdir} documenting: detected stack, added multi-tenancy, auth strategy, billing wiring, how to deploy.
5. Return a JSON summary as your final output including: project_name, stack, services_added, next_steps.`;
    try {
      const result = await client.post("/api/v1/ai/claude/run", {
        prompt,
        workdir,
        timeout: 1800000,
        max_turns: 50,
      });
      return jsonResult({
        ...result,
        project_name: slug,
        output_dir: workdir,
        message: "Conversion started. Poll fast_saas_convert_status(job_id) for progress.",
      });
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "fast_saas_convert_status",
  "Poll the status of an OSS-to-SaaS conversion job. Returns status (queued/running/done/failed/timeout), stdout, stderr, and exit_code.",
  { job_id: z.string().describe("Job UUID from fast_saas_convert_to_saas") },
  async ({ job_id }) => {
    try {
      const result = await client.get(`/api/v1/ai/claude/jobs/${job_id}`);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

// ═══════════════════════════════════════════════
// APPSMITH (4)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_appsmith_list_apps",
  "List all Appsmith applications (low-code internal tools)",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/services/appsmith/applications");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_appsmith_get_app",
  "Get details of a specific Appsmith application",
  { app_id: z.string().describe("Appsmith application ID") },
  async ({ app_id }) => {
    try {
      const result = await client.get(`/api/v1/services/appsmith/applications/${app_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_appsmith_list_pages",
  "List pages in an Appsmith application",
  { app_id: z.string().describe("Appsmith application ID") },
  async ({ app_id }) => {
    try {
      const result = await client.get(`/api/v1/services/appsmith/applications/${app_id}/pages`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_appsmith_list_datasources",
  "List all Appsmith datasources (database connections, API endpoints)",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/services/appsmith/datasources");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// DOCMOST (4)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_docmost_list_workspaces",
  "List all Docmost workspaces (knowledge base)",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/services/docmost/workspaces");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_docmost_list_pages",
  "List pages in a Docmost space",
  { space_id: z.string().describe("Docmost space ID") },
  async ({ space_id }) => {
    try {
      const result = await client.get(`/api/v1/services/docmost/spaces/${space_id}/pages`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_docmost_get_page",
  "Get a specific Docmost page with content",
  { page_id: z.string().describe("Docmost page ID") },
  async ({ page_id }) => {
    try {
      const result = await client.get(`/api/v1/services/docmost/pages/${page_id}`);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_docmost_create_page",
  "Create a new page in Docmost",
  {
    title: z.string().describe("Page title"),
    content: z.string().optional().describe("Page content (markdown)"),
    space_id: z.string().describe("Space ID to create the page in"),
  },
  async (args) => {
    try {
      const result = await client.post("/api/v1/services/docmost/pages", {
        title: args.title,
        content: args.content,
        spaceId: args.space_id,
      });
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// POSTHOG (4)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_posthog_list_feature_flags",
  "List all PostHog feature flags",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/services/posthog/feature-flags");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_posthog_list_insights",
  "List PostHog insights (saved analytics queries)",
  { limit: z.number().optional().describe("Max results (default 10)") },
  async ({ limit }) => {
    try {
      const params: Record<string, string> = {};
      if (limit) params.limit = String(limit);
      const result = await client.get("/api/v1/services/posthog/insights", params);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_posthog_list_persons",
  "List persons (users) tracked by PostHog",
  { search: z.string().optional().describe("Search by email or name") },
  async ({ search }) => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const result = await client.get("/api/v1/services/posthog/persons", params);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_posthog_list_events",
  "List recent PostHog events (analytics data)",
  {
    event: z.string().optional().describe("Filter by event name (e.g. $pageview, signup)"),
    limit: z.number().optional().describe("Max results (default 20)"),
  },
  async ({ event, limit }) => {
    try {
      const params: Record<string, string> = {};
      if (event) params.event = event;
      if (limit) params.limit = String(limit);
      const result = await client.get("/api/v1/services/posthog/events", params);
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// SERVICES HEALTH (1)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_services_health",
  "Check health of Appsmith, Docmost, and PostHog",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/services/health");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// AI TOOLS — SYSTEM (2)
// ═══════════════════════════════════════════════

server.tool(
  "fast_saas_ai_health",
  "Check health of all AI services (Ollama, Langflow, Claude Agent, Langfuse)",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/ai/health");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

server.tool(
  "fast_saas_langfuse_health",
  "Check Langfuse LLM observability service health",
  {},
  async () => {
    try {
      const result = await client.get("/api/v1/ai/langfuse/health");
      return jsonResult(result);
    } catch (e: any) { return jsonResult({ error: e.message }); }
  }
);

// ═══════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════

const transport = new StdioServerTransport();
await server.connect(transport);
