export interface ServiceInfo {
  id: string;
  name: string;
  group: "essential" | "core" | "ops" | "growth" | "ai";
  subdomain?: string;
  description: string;
  icon: string;
  healthPath?: string;
  port?: number;
}

export const services: ServiceInfo[] = [
  // Essential
  { id: "postgres", name: "PostgreSQL", group: "essential", description: "Primary database", icon: "🗄️" },
  { id: "redis", name: "Redis", group: "essential", description: "Cache & sessions", icon: "⚡" },
  { id: "caddy", name: "Caddy", group: "essential", description: "Reverse proxy", icon: "🔒" },
  // Core
  { id: "logto", name: "Logto", group: "core", subdomain: "auth", description: "Auth & SSO", icon: "🔑", healthPath: "/api/status", port: 3301 },
  { id: "lago", name: "Lago", group: "core", subdomain: "billing", description: "Billing & subscriptions", icon: "💰", healthPath: "/health", port: 3000 },
  { id: "rustfs", name: "RustFS", group: "core", subdomain: "storage", description: "S3 storage", icon: "📦", port: 9000 },
  { id: "saas-api", name: "SaaS API", group: "core", subdomain: "api", description: "REST API (38 endpoints)", icon: "🔌", healthPath: "/health", port: 4000 },
  // Ops
  { id: "glitchtip", name: "GlitchTip", group: "ops", subdomain: "errors", description: "Error tracking", icon: "🐛", healthPath: "/_health/", port: 8000 },
  { id: "uptime-kuma", name: "Uptime Kuma", group: "ops", subdomain: "status", description: "Status page", icon: "📊", port: 3001 },
  { id: "grafana", name: "Grafana", group: "ops", subdomain: "monitor", description: "Dashboards", icon: "📈", healthPath: "/api/health", port: 3000 },
  // Growth
  { id: "matomo", name: "Matomo", group: "growth", subdomain: "analytics", description: "Web analytics", icon: "📉" },
  { id: "mautic", name: "Mautic", group: "growth", subdomain: "email", description: "Email marketing", icon: "📧" },
  { id: "nocodb", name: "NocoDB", group: "growth", subdomain: "admin", description: "Admin dashboard", icon: "📋", healthPath: "/api/v1/health", port: 8080 },
  { id: "n8n", name: "n8n", group: "growth", subdomain: "auto", description: "Workflow automation", icon: "⚙️", healthPath: "/healthz", port: 5678 },
  { id: "appsmith", name: "Appsmith", group: "growth", subdomain: "tools", description: "Internal tools", icon: "🛠️" },
  { id: "docmost", name: "Docmost", group: "growth", subdomain: "docs", description: "Knowledge base", icon: "📖" },
  // AI
  { id: "librechat", name: "LibreChat", group: "ai", subdomain: "chat", description: "AI chat", icon: "💬", healthPath: "/api/health", port: 3080 },
  { id: "langflow", name: "Langflow", group: "ai", subdomain: "flow", description: "AI workflows", icon: "🔀", healthPath: "/health", port: 7860 },
  { id: "ollama", name: "Ollama", group: "ai", subdomain: "models", description: "Local LLMs", icon: "🧠", port: 11434 },
  { id: "claude-agent", name: "Claude Agent", group: "ai", subdomain: "agent", description: "Coding agent", icon: "🤖", healthPath: "/health", port: 3100 },
  { id: "langfuse", name: "Langfuse", group: "ai", subdomain: "observe", description: "LLM observability", icon: "👁️", healthPath: "/api/public/health", port: 3900 },
];

export const groupLabels: Record<string, { label: string; color: string }> = {
  essential: { label: "Essential", color: "#00D28C" },
  core: { label: "Core", color: "#7B5CF0" },
  ops: { label: "Ops", color: "#3B82F6" },
  growth: { label: "Growth", color: "#F59E0B" },
  ai: { label: "AI", color: "#E84393" },
};
