/**
 * Module Registry — defines all available services in the toolkit.
 * Each module is a self-contained definition that the generators
 * use to produce Docker Compose, env, and Caddy configurations.
 */

export interface EnvVarDef {
  key: string;
  description: string;
  default?: string;
  secret?: boolean; // Auto-generate a random value
  required?: boolean;
}

export interface CaddyRoute {
  subdomain: string;
  target: string; // service:port
}

export interface HealthCheck {
  path: string;
  port: number;
  method?: string;
  intervalSeconds?: number;
}

export type ModuleGroup = "essential" | "core" | "ops" | "growth" | "ai";

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  group: ModuleGroup;
  defaultEnabled: boolean;
  dependencies: string[]; // Other module IDs
  image: string;
  ports: Record<string, number>;
  envVars: EnvVarDef[];
  healthCheck?: HealthCheck;
  caddyRoutes: CaddyRoute[];
  volumes: string[];
  /** Extra services this module needs (e.g., matomo needs its own MariaDB) */
  sidecars?: SidecarDef[];
  /** Which PostgreSQL database name this service uses (auto-created by setup.sh) */
  pgDatabase?: string;
  /** Redis DB index (0-15) */
  redisDb?: number;
  /** Additional compose-level config */
  composeExtras?: Record<string, unknown>;
}

export interface SidecarDef {
  name: string;
  image: string;
  envVars: EnvVarDef[];
  volumes: string[];
  healthCheck?: HealthCheck;
}

// ── Essential Modules ───��─────────────────────

const postgres: ModuleDefinition = {
  id: "postgres",
  name: "PostgreSQL",
  description: "Primary relational database",
  group: "essential",
  defaultEnabled: true,
  dependencies: [],
  image: "postgres:16-alpine",
  ports: { db: 5432 },
  envVars: [
    { key: "POSTGRES_USER", description: "Database superuser", default: "saas" },
    { key: "POSTGRES_PASSWORD", description: "Database password", secret: true, required: true },
    { key: "POSTGRES_DB", description: "Default database name", default: "saas" },
    { key: "POSTGRES_PORT", description: "Exposed port", default: "5432" },
  ],
  healthCheck: { path: "", port: 5432, method: "pg_isready" },
  caddyRoutes: [],
  volumes: ["pg-data:/var/lib/postgresql/data"],
};

const redis: ModuleDefinition = {
  id: "redis",
  name: "Redis",
  description: "In-memory cache, sessions, and rate limiting",
  group: "essential",
  defaultEnabled: true,
  dependencies: [],
  image: "redis:7-alpine",
  ports: { cache: 6379 },
  envVars: [
    { key: "REDIS_PASSWORD", description: "Redis password", secret: true, required: true },
    { key: "REDIS_PORT", description: "Exposed port", default: "6379" },
  ],
  healthCheck: { path: "", port: 6379, method: "redis-ping" },
  caddyRoutes: [],
  volumes: ["redis-data:/data"],
};

const caddy: ModuleDefinition = {
  id: "caddy",
  name: "Caddy",
  description: "Reverse proxy with automatic HTTPS",
  group: "essential",
  defaultEnabled: true,
  dependencies: [],
  image: "caddy:2-alpine",
  ports: { http: 80, https: 443 },
  envVars: [
    { key: "DOMAIN", description: "Your domain (e.g., example.com)", required: true },
  ],
  caddyRoutes: [],
  volumes: ["caddy-data:/data", "caddy-config:/config"],
};

// ── Core Modules ──────────────────────────────

const logto: ModuleDefinition = {
  id: "logto",
  name: "Logto",
  description: "Authentication, SSO, RBAC, multi-tenant organizations",
  group: "core",
  defaultEnabled: true,
  dependencies: ["postgres"],
  image: "svhd/logto:latest",
  ports: { app: 3001, admin: 3002 },
  envVars: [
    { key: "LOGTO_PORT", description: "App port", default: "3301" },
    { key: "LOGTO_ADMIN_PORT", description: "Admin port", default: "3302" },
  ],
  healthCheck: { path: "/api/status", port: 3001 },
  pgDatabase: "logto",
  caddyRoutes: [
    { subdomain: "auth", target: "logto:3001" },
    { subdomain: "auth-admin", target: "logto:3002" },
  ],
  volumes: [],
};

const lago: ModuleDefinition = {
  id: "lago",
  name: "Lago",
  description: "Usage-based billing and subscriptions",
  group: "core",
  defaultEnabled: true,
  dependencies: ["postgres", "redis"],
  image: "getlago/api:latest",
  ports: { api: 3000 },
  envVars: [
    { key: "LAGO_SECRET_KEY", description: "Rails secret key", secret: true, required: true },
    { key: "LAGO_RSA_PRIVATE_KEY", description: "RSA private key for JWT", secret: true, required: true },
    { key: "LAGO_ENCRYPTION_PRIMARY_KEY", description: "Primary encryption key", secret: true, required: true },
    { key: "LAGO_ENCRYPTION_DETERMINISTIC_KEY", description: "Deterministic encryption key", secret: true, required: true },
    { key: "LAGO_ENCRYPTION_KEY_SALT", description: "Encryption key salt", secret: true, required: true },
  ],
  healthCheck: { path: "/health", port: 3000 },
  pgDatabase: "lago",
  caddyRoutes: [
    { subdomain: "billing", target: "lago-front:80" },
    { subdomain: "billing-api", target: "lago-api:3000" },
  ],
  volumes: ["lago-data:/app/storage"],
};

const rustfs: ModuleDefinition = {
  id: "rustfs",
  name: "RustFS",
  description: "S3-compatible object storage",
  group: "core",
  defaultEnabled: true,
  dependencies: [],
  image: "rustfs/rustfs:latest",
  ports: { api: 9000, console: 9001 },
  envVars: [
    { key: "RUSTFS_ACCESS_KEY", description: "S3 access key", secret: true, required: true },
    { key: "RUSTFS_SECRET_KEY", description: "S3 secret key", secret: true, required: true },
    { key: "RUSTFS_API_PORT", description: "API port", default: "9000" },
    { key: "RUSTFS_CONSOLE_PORT", description: "Console port", default: "9001" },
  ],
  healthCheck: { path: "/minio/health/live", port: 9000 },
  caddyRoutes: [
    { subdomain: "storage", target: "rustfs:9000" },
    { subdomain: "storage-console", target: "rustfs:9001" },
  ],
  volumes: ["rustfs-data:/data"],
};

// ── Ops Modules ───────────────────────────────

const glitchtip: ModuleDefinition = {
  id: "glitchtip",
  name: "GlitchTip",
  description: "Error tracking (Sentry-compatible)",
  group: "ops",
  defaultEnabled: true,
  dependencies: ["postgres", "redis"],
  image: "glitchtip/glitchtip:latest",
  ports: { web: 8000 },
  envVars: [
    { key: "GLITCHTIP_SECRET_KEY", description: "Django secret key", secret: true, required: true },
  ],
  healthCheck: { path: "/_health/", port: 8000 },
  pgDatabase: "glitchtip",
  redisDb: 1,
  caddyRoutes: [{ subdomain: "errors", target: "glitchtip:8000" }],
  volumes: [],
};

const uptimeKuma: ModuleDefinition = {
  id: "uptime-kuma",
  name: "Uptime Kuma",
  description: "Uptime monitoring and status pages",
  group: "ops",
  defaultEnabled: true,
  dependencies: [],
  image: "louislam/uptime-kuma:latest",
  ports: { web: 3001 },
  envVars: [],
  healthCheck: { path: "/api/status-page/heartbeat", port: 3001 },
  caddyRoutes: [{ subdomain: "status", target: "uptime-kuma:3001" }],
  volumes: ["uptime-kuma-data:/app/data"],
};

const grafanaStack: ModuleDefinition = {
  id: "grafana-stack",
  name: "Grafana Stack",
  description: "Metrics, dashboards, and log aggregation (Grafana + Prometheus + Loki)",
  group: "ops",
  defaultEnabled: true,
  dependencies: [],
  image: "grafana/grafana:latest",
  ports: { grafana: 3000, prometheus: 9090, loki: 3100 },
  envVars: [
    { key: "GRAFANA_ADMIN_USER", description: "Grafana admin username", default: "admin" },
    { key: "GRAFANA_ADMIN_PASSWORD", description: "Grafana admin password", secret: true, required: true },
  ],
  healthCheck: { path: "/api/health", port: 3000 },
  caddyRoutes: [{ subdomain: "monitor", target: "grafana:3000" }],
  volumes: ["grafana-data:/var/lib/grafana", "prometheus-data:/prometheus", "loki-data:/loki"],
};

// ── Growth Modules ─────────────���──────────────

const matomo: ModuleDefinition = {
  id: "matomo",
  name: "Matomo",
  description: "Web analytics (GDPR-compliant)",
  group: "growth",
  defaultEnabled: false,
  dependencies: [],
  image: "matomo:latest",
  ports: { web: 8080 },
  envVars: [
    { key: "MATOMO_DB_PASSWORD", description: "Matomo MariaDB password", secret: true, required: true },
    { key: "MATOMO_DB_ROOT_PASSWORD", description: "MariaDB root password", secret: true, required: true },
  ],
  healthCheck: { path: "/", port: 80 },
  caddyRoutes: [{ subdomain: "analytics", target: "matomo:80" }],
  volumes: ["matomo-data:/var/www/html"],
  sidecars: [
    {
      name: "matomo-db",
      image: "mariadb:11",
      envVars: [
        { key: "MARIADB_ROOT_PASSWORD", description: "Root password", secret: true },
        { key: "MARIADB_DATABASE", description: "Database name", default: "matomo" },
        { key: "MARIADB_USER", description: "Database user", default: "matomo" },
        { key: "MARIADB_PASSWORD", description: "Database password", secret: true },
      ],
      volumes: ["matomo-db-data:/var/lib/mysql"],
      healthCheck: { path: "", port: 3306, method: "mariadb-healthcheck" },
    },
  ],
};

const mautic: ModuleDefinition = {
  id: "mautic",
  name: "Mautic",
  description: "Email marketing automation",
  group: "growth",
  defaultEnabled: false,
  dependencies: ["postgres"],
  image: "mautic/mautic:latest",
  ports: { web: 80 },
  envVars: [
    { key: "MAUTIC_ADMIN_PASSWORD", description: "Mautic admin password", secret: true, required: true },
  ],
  healthCheck: { path: "/s/login", port: 80, intervalSeconds: 30 },
  pgDatabase: "mautic",
  caddyRoutes: [{ subdomain: "email", target: "mautic:80" }],
  volumes: ["mautic-data:/var/www/html"],
};

const stalwart: ModuleDefinition = {
  id: "stalwart",
  name: "Stalwart",
  description: "Full SMTP/IMAP mail server",
  group: "growth",
  defaultEnabled: false,
  dependencies: [],
  image: "stalwartlabs/mail-server:latest",
  ports: { smtp: 25, submission: 587, imap: 993, web: 8080 },
  envVars: [
    { key: "SMTP_USER", description: "Default SMTP user", default: "noreply" },
    { key: "SMTP_PASSWORD", description: "SMTP password", secret: true, required: true },
  ],
  healthCheck: { path: "/healthz", port: 8080 },
  caddyRoutes: [],
  volumes: ["stalwart-data:/opt/stalwart-mail"],
};

const nocodb: ModuleDefinition = {
  id: "nocodb",
  name: "NocoDB",
  description: "Admin dashboard (spreadsheet over databases)",
  group: "growth",
  defaultEnabled: false,
  dependencies: ["postgres"],
  image: "nocodb/nocodb:latest",
  ports: { web: 8080 },
  envVars: [
    { key: "NOCODB_JWT_SECRET", description: "NocoDB JWT secret", secret: true, required: true },
  ],
  healthCheck: { path: "/api/v1/health", port: 8080 },
  pgDatabase: "nocodb",
  caddyRoutes: [{ subdomain: "admin", target: "nocodb:8080" }],
  volumes: ["nocodb-data:/usr/app/data"],
};

const n8n: ModuleDefinition = {
  id: "n8n",
  name: "n8n",
  description: "Workflow automation",
  group: "growth",
  defaultEnabled: false,
  dependencies: ["postgres"],
  image: "n8nio/n8n:latest",
  ports: { web: 5678 },
  envVars: [
    { key: "N8N_ENCRYPTION_KEY", description: "n8n encryption key", secret: true, required: true },
  ],
  healthCheck: { path: "/healthz", port: 5678 },
  pgDatabase: "n8n",
  caddyRoutes: [{ subdomain: "auto", target: "n8n:5678" }],
  volumes: ["n8n-data:/home/node/.n8n"],
};

const appsmith: ModuleDefinition = {
  id: "appsmith",
  name: "Appsmith",
  description: "Low-code internal tool builder",
  group: "growth",
  defaultEnabled: false,
  dependencies: [],
  image: "appsmith/appsmith-ce:latest",
  ports: { web: 80 },
  envVars: [],
  healthCheck: { path: "/api/v1/users/me", port: 80, intervalSeconds: 30 },
  caddyRoutes: [{ subdomain: "tools", target: "appsmith:80" }],
  volumes: ["appsmith-data:/appsmith-stacks"],
};

const docmost: ModuleDefinition = {
  id: "docmost",
  name: "Docmost",
  description: "Knowledge base and documentation",
  group: "growth",
  defaultEnabled: false,
  dependencies: ["postgres", "redis"],
  image: "docmost/docmost:latest",
  ports: { web: 3000 },
  envVars: [
    { key: "DOCMOST_SECRET", description: "Docmost app secret", secret: true, required: true },
  ],
  healthCheck: { path: "/", port: 3000 },
  pgDatabase: "docmost",
  redisDb: 2,
  caddyRoutes: [{ subdomain: "docs", target: "docmost:3000" }],
  volumes: ["docmost-data:/usr/src/app/data"],
};

const posthog: ModuleDefinition = {
  id: "posthog",
  name: "PostHog",
  description: "Product analytics, feature flags, session replay",
  group: "growth",
  defaultEnabled: false,
  dependencies: ["postgres", "redis"],
  image: "posthog/posthog:latest",
  ports: { web: 8000 },
  envVars: [
    { key: "POSTHOG_SECRET_KEY", description: "PostHog secret key", secret: true, required: true },
  ],
  healthCheck: { path: "/_health", port: 8000 },
  pgDatabase: "posthog",
  redisDb: 3,
  caddyRoutes: [{ subdomain: "product", target: "posthog:8000" }],
  volumes: ["posthog-data:/var/lib/posthog"],
};

// ── AI Modules ────────────────────────────────

const librechat: ModuleDefinition = {
  id: "librechat",
  name: "LibreChat",
  description: "Multi-model AI chat interface (ChatGPT alternative)",
  group: "ai",
  defaultEnabled: false,
  dependencies: ["redis"],
  image: "ghcr.io/danny-avila/librechat:latest",
  ports: { web: 3080 },
  envVars: [
    { key: "LIBRECHAT_CREDS_KEY", description: "Credentials encryption key (32 hex chars)", secret: true, required: true },
    { key: "LIBRECHAT_CREDS_IV", description: "Credentials encryption IV (16 hex chars)", secret: true, required: true },
    { key: "LIBRECHAT_JWT_SECRET", description: "JWT secret", secret: true, required: true },
    { key: "LIBRECHAT_JWT_REFRESH_SECRET", description: "JWT refresh secret", secret: true, required: true },
    { key: "MEILI_MASTER_KEY", description: "Meilisearch master key", secret: true, required: true },
    { key: "LIBRECHAT_MONGODB_PASSWORD", description: "MongoDB password", secret: true, required: true },
  ],
  healthCheck: { path: "/api/health", port: 3080 },
  redisDb: 4,
  caddyRoutes: [{ subdomain: "chat", target: "librechat:3080" }],
  volumes: ["librechat-uploads:/app/uploads", "librechat-logs:/app/logs"],
  sidecars: [
    {
      name: "librechat-mongodb",
      image: "mongo:8.0",
      envVars: [
        { key: "MONGO_INITDB_ROOT_USERNAME", description: "MongoDB root user", default: "librechat" },
        { key: "MONGO_INITDB_ROOT_PASSWORD", description: "MongoDB root password", secret: true },
      ],
      volumes: ["librechat-mongodb-data:/data/db"],
      healthCheck: { path: "", port: 27017, method: "mongosh" },
    },
    {
      name: "librechat-meilisearch",
      image: "getmeili/meilisearch:v1.35.1",
      envVars: [
        { key: "MEILI_MASTER_KEY", description: "Meilisearch master key", secret: true },
      ],
      volumes: ["librechat-meilisearch-data:/meili_data"],
      healthCheck: { path: "/health", port: 7700 },
    },
  ],
};

const langflow: ModuleDefinition = {
  id: "langflow",
  name: "Langflow",
  description: "Visual LLM workflow builder with API backend",
  group: "ai",
  defaultEnabled: false,
  dependencies: ["postgres"],
  image: "langflowai/langflow:latest",
  ports: { web: 7860 },
  envVars: [
    { key: "LANGFLOW_SECRET_KEY", description: "Langflow secret key", secret: true, required: true },
    { key: "LANGFLOW_AUTO_LOGIN", description: "Auto-login on startup", default: "true" },
    { key: "LANGFLOW_SUPERUSER", description: "Admin username", default: "admin" },
    { key: "LANGFLOW_SUPERUSER_PASSWORD", description: "Admin password", secret: true, required: true },
  ],
  healthCheck: { path: "/health", port: 7860, intervalSeconds: 30 },
  pgDatabase: "langflow",
  caddyRoutes: [{ subdomain: "flow", target: "langflow:7860" }],
  volumes: ["langflow-data:/app/langflow"],
};

const ollama: ModuleDefinition = {
  id: "ollama",
  name: "Ollama",
  description: "Run open-source LLMs locally (Llama, Mistral, Gemma, etc.)",
  group: "ai",
  defaultEnabled: false,
  dependencies: [],
  image: "ollama/ollama:latest",
  ports: { api: 11434 },
  envVars: [],
  healthCheck: { path: "/", port: 11434, method: "ollama-check" },
  caddyRoutes: [{ subdomain: "models", target: "ollama:11434" }],
  volumes: ["ollama-data:/root/.ollama"],
};

const claudeAgent: ModuleDefinition = {
  id: "claude-agent",
  name: "Claude Agent",
  description: "Containerized Claude Code agent runner with HTTP API",
  group: "ai",
  defaultEnabled: false,
  dependencies: [],
  image: "build", // Custom build from Dockerfile
  ports: { api: 3100 },
  envVars: [
    { key: "ANTHROPIC_API_KEY", description: "Anthropic API key (required for Claude)", required: true },
    { key: "CLAUDE_AGENT_API_KEY", description: "API key for the agent runner endpoint", secret: true, required: true },
    { key: "CLAUDE_AGENT_PORT", description: "Agent runner port", default: "3100" },
  ],
  healthCheck: { path: "/health", port: 3100 },
  caddyRoutes: [{ subdomain: "agent", target: "claude-agent:3100" }],
  volumes: ["claude-agent-workspace:/workspace"],
};

// ── Registry ──────────────────────────────────

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  postgres,
  redis,
  caddy,
  logto,
  lago,
  rustfs,
  glitchtip,
  "uptime-kuma": uptimeKuma,
  "grafana-stack": grafanaStack,
  matomo,
  mautic,
  stalwart,
  nocodb,
  n8n,
  appsmith,
  docmost,
  posthog,
  librechat,
  langflow,
  ollama,
  "claude-agent": claudeAgent,
};

export const MODULE_GROUPS: Record<ModuleGroup, string[]> = {
  essential: ["postgres", "redis", "caddy"],
  core: ["logto", "lago", "rustfs"],
  ops: ["glitchtip", "uptime-kuma", "grafana-stack"],
  growth: ["matomo", "mautic", "stalwart", "nocodb", "n8n", "appsmith", "docmost", "posthog"],
  ai: ["librechat", "langflow", "ollama", "claude-agent"],
};

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY[id];
}

export function getModulesByGroup(group: ModuleGroup): ModuleDefinition[] {
  return (MODULE_GROUPS[group] || []).map(id => MODULE_REGISTRY[id]).filter(Boolean);
}

export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}
