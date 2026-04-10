/**
 * Docker Compose generator.
 * Produces a complete docker-compose.yml from selected modules.
 * Each module maps to one or more services with proper networking,
 * volumes, health checks, and dependency ordering.
 */

import type { ModuleDefinition } from "../modules/registry.js";
import * as YAML from "yaml";

interface ComposeService {
  image: string;
  profiles?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  ports?: string[];
  depends_on?: Record<string, { condition: string }>;
  healthcheck?: {
    test: string[];
    interval: string;
    timeout: string;
    retries: number;
  };
  command?: string | string[];
  restart: string;
  networks: string[];
}

export function generateComposeFile(modules: ModuleDefinition[]): string {
  const services: Record<string, ComposeService> = {};
  const volumes: Record<string, null> = {};

  for (const mod of modules) {
    const service = buildService(mod, modules);
    const serviceName = getServiceName(mod);
    services[serviceName] = service;

    // Collect volumes
    for (const vol of mod.volumes) {
      const volName = vol.split(":")[0];
      volumes[volName] = null;
    }

    // Add sidecars
    if (mod.sidecars) {
      for (const sidecar of mod.sidecars) {
        services[sidecar.name] = buildSidecar(sidecar, mod);
        for (const vol of sidecar.volumes) {
          volumes[vol.split(":")[0]] = null;
        }
      }
    }
  }

  const compose = {
    "x-common": {
      "&common": null,
      restart: "unless-stopped",
      networks: ["saas-internal"],
    },
    services,
    networks: {
      "saas-internal": { driver: "bridge" },
      "saas-public": { driver: "bridge" },
    },
    volumes,
  };

  // Use YAML library for clean output
  const doc = new YAML.Document(compose);
  return `# Autonomyx Fast SaaS Toolkit — Docker Compose\n# Auto-generated — edit with care\n\n${doc.toString()}`;
}

function getServiceName(mod: ModuleDefinition): string {
  // Special cases for multi-service modules
  if (mod.id === "lago") return "lago-api";
  return mod.id;
}

function buildService(mod: ModuleDefinition, allModules: ModuleDefinition[]): ComposeService {
  const service: ComposeService = {
    image: mod.image,
    restart: "unless-stopped",
    networks: ["saas-internal"],
  };

  // Profiles (essential modules don't need a profile flag for basic usage)
  if (mod.group !== "essential") {
    service.profiles = [mod.group];
  }

  // Environment variables
  const env = buildEnvironment(mod);
  if (Object.keys(env).length > 0) {
    service.environment = env;
  }

  // Volumes
  if (mod.volumes.length > 0) {
    service.volumes = [...mod.volumes];
  }

  // Ports (only expose essential services and admin ports by default)
  if (mod.group === "essential" || mod.id === "logto") {
    const portMappings = buildPortMappings(mod);
    if (portMappings.length > 0) {
      service.ports = portMappings;
    }
  }

  // Caddy gets both networks
  if (mod.id === "caddy") {
    service.networks = ["saas-internal", "saas-public"];
    service.ports = ["80:80", "443:443", "443:443/udp"];
    service.volumes = [
      "./Caddyfile:/etc/caddy/Caddyfile:ro",
      "caddy-data:/data",
      "caddy-config:/config",
    ];
  }

  // Dependencies
  const deps = buildDependsOn(mod);
  if (Object.keys(deps).length > 0) {
    service.depends_on = deps;
  }

  // Health check
  if (mod.healthCheck) {
    service.healthcheck = buildHealthCheck(mod);
  }

  // Special service configs
  applySpecialConfig(mod, service);

  return service;
}

function buildEnvironment(mod: ModuleDefinition): Record<string, string> {
  const env: Record<string, string> = {};

  switch (mod.id) {
    case "postgres":
      env.POSTGRES_USER = "${POSTGRES_USER:-saas}";
      env.POSTGRES_PASSWORD = "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}";
      env.POSTGRES_DB = "${POSTGRES_DB:-saas}";
      break;
    case "redis":
      // Command-based, not env-based
      break;
    case "logto":
      env.TRUST_PROXY_HEADER = "1";
      env.DB_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/logto";
      env.ENDPOINT = "https://auth.${DOMAIN}";
      env.ADMIN_ENDPOINT = "https://auth-admin.${DOMAIN}";
      break;
    case "lago":
      env.LAGO_API_URL = "https://billing-api.${DOMAIN}";
      env.DATABASE_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/lago";
      env.REDIS_URL = "redis://:${REDIS_PASSWORD}@redis:6379";
      env.RAILS_ENV = "production";
      env.SECRET_KEY_BASE = "${LAGO_SECRET_KEY}";
      env.LAGO_RSA_PRIVATE_KEY = "${LAGO_RSA_PRIVATE_KEY}";
      env.ENCRYPTION_PRIMARY_KEY = "${LAGO_ENCRYPTION_PRIMARY_KEY}";
      env.ENCRYPTION_DETERMINISTIC_KEY = "${LAGO_ENCRYPTION_DETERMINISTIC_KEY}";
      env.ENCRYPTION_KEY_DERIVATION_SALT = "${LAGO_ENCRYPTION_KEY_SALT}";
      break;
    case "rustfs":
      env.RUSTFS_ROOT_USER = "${RUSTFS_ACCESS_KEY}";
      env.RUSTFS_ROOT_PASSWORD = "${RUSTFS_SECRET_KEY}";
      break;
    case "glitchtip":
      env.DATABASE_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/glitchtip";
      env.SECRET_KEY = "${GLITCHTIP_SECRET_KEY}";
      env.PORT = "8000";
      env.GLITCHTIP_DOMAIN = "https://errors.${DOMAIN}";
      env.DEFAULT_FROM_EMAIL = "errors@${DOMAIN}";
      env.CELERY_WORKER_AUTOSCALE = "1,3";
      env.REDIS_URL = "redis://:${REDIS_PASSWORD}@redis:6379/1";
      break;
    case "grafana-stack":
      env.GF_SECURITY_ADMIN_USER = "${GRAFANA_ADMIN_USER:-admin}";
      env.GF_SECURITY_ADMIN_PASSWORD = "${GRAFANA_ADMIN_PASSWORD}";
      env.GF_SERVER_ROOT_URL = "https://monitor.${DOMAIN}";
      break;
    case "nocodb":
      env.NC_DB = "pg://postgres:5432?u=${POSTGRES_USER:-saas}&p=${POSTGRES_PASSWORD}&d=nocodb";
      env.NC_AUTH_JWT_SECRET = "${NOCODB_JWT_SECRET}";
      break;
    case "n8n":
      env.DB_TYPE = "postgresdb";
      env.DB_POSTGRESDB_HOST = "postgres";
      env.DB_POSTGRESDB_PORT = "5432";
      env.DB_POSTGRESDB_DATABASE = "n8n";
      env.DB_POSTGRESDB_USER = "${POSTGRES_USER:-saas}";
      env.DB_POSTGRESDB_PASSWORD = "${POSTGRES_PASSWORD}";
      env.N8N_HOST = "auto.${DOMAIN}";
      env.N8N_PROTOCOL = "https";
      env.WEBHOOK_URL = "https://auto.${DOMAIN}/";
      env.N8N_ENCRYPTION_KEY = "${N8N_ENCRYPTION_KEY}";
      break;
    case "docmost":
      env.DATABASE_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/docmost";
      env.REDIS_URL = "redis://:${REDIS_PASSWORD}@redis:6379/2";
      env.APP_SECRET = "${DOCMOST_SECRET}";
      env.APP_URL = "https://docs.${DOMAIN}";
      break;
    case "mautic":
      env.MAUTIC_DB_HOST = "postgres";
      env.MAUTIC_DB_PORT = "5432";
      env.MAUTIC_DB_NAME = "mautic";
      env.MAUTIC_DB_USER = "${POSTGRES_USER:-saas}";
      env.MAUTIC_DB_PASSWORD = "${POSTGRES_PASSWORD}";
      env.MAUTIC_ADMIN_EMAIL = "${ADMIN_EMAIL}";
      env.MAUTIC_ADMIN_PASSWORD = "${MAUTIC_ADMIN_PASSWORD}";
      break;
    case "matomo":
      env.MATOMO_DATABASE_HOST = "matomo-db";
      env.MATOMO_DATABASE_ADAPTER = "mysql";
      env.MATOMO_DATABASE_TABLES_PREFIX = "matomo_";
      env.MATOMO_DATABASE_USERNAME = "matomo";
      env.MATOMO_DATABASE_PASSWORD = "${MATOMO_DB_PASSWORD}";
      env.MATOMO_DATABASE_DBNAME = "matomo";
      break;
    case "posthog":
      env.DATABASE_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/posthog";
      env.REDIS_URL = "redis://:${REDIS_PASSWORD}@redis:6379/3";
      env.SECRET_KEY = "${POSTHOG_SECRET_KEY}";
      break;
    case "librechat":
      env.MONGO_URI = "mongodb://librechat:${LIBRECHAT_MONGODB_PASSWORD}@librechat-mongodb:27017/LibreChat?authSource=admin";
      env.MEILI_HOST = "http://librechat-meilisearch:7700";
      env.MEILI_MASTER_KEY = "${MEILI_MASTER_KEY}";
      env.CREDS_KEY = "${LIBRECHAT_CREDS_KEY}";
      env.CREDS_IV = "${LIBRECHAT_CREDS_IV}";
      env.JWT_SECRET = "${LIBRECHAT_JWT_SECRET}";
      env.JWT_REFRESH_SECRET = "${LIBRECHAT_JWT_REFRESH_SECRET}";
      env.REDIS_URI = "redis://:${REDIS_PASSWORD}@redis:6379/4";
      env.DOMAIN_CLIENT = "https://chat.${DOMAIN}";
      env.DOMAIN_SERVER = "https://chat.${DOMAIN}";
      env.OLLAMA_BASE_URL = "http://ollama:11434";
      break;
    case "langflow":
      env.LANGFLOW_DATABASE_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/langflow";
      env.LANGFLOW_CONFIG_DIR = "/app/langflow";
      env.LANGFLOW_AUTO_LOGIN = "${LANGFLOW_AUTO_LOGIN:-true}";
      env.LANGFLOW_SUPERUSER = "${LANGFLOW_SUPERUSER:-admin}";
      env.LANGFLOW_SUPERUSER_PASSWORD = "${LANGFLOW_SUPERUSER_PASSWORD}";
      env.LANGFLOW_SECRET_KEY = "${LANGFLOW_SECRET_KEY}";
      env.OLLAMA_BASE_URL = "http://ollama:11434";
      break;
    case "postiz":
      env.MAIN_URL = "https://social.${DOMAIN}";
      env.FRONTEND_URL = "https://social.${DOMAIN}";
      env.NEXT_PUBLIC_BACKEND_URL = "https://social.${DOMAIN}/api";
      env.BACKEND_INTERNAL_URL = "http://localhost:3000";
      env.DATABASE_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/postiz";
      env.REDIS_URL = "redis://:${REDIS_PASSWORD}@redis:6379/5";
      env.JWT_SECRET = "${POSTIZ_JWT_SECRET}";
      env.IS_GENERAL = "true";
      env.STORAGE_PROVIDER = "local";
      env.UPLOAD_DIRECTORY = "/uploads";
      env.NEXT_PUBLIC_UPLOAD_DIRECTORY = "/uploads";
      break;
    case "tooljet":
      env.TOOLJET_DB = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/tooljet";
      env.SECRET_KEY_BASE = "${TOOLJET_SECRET_KEY}";
      env.TOOLJET_HOST = "https://build.${DOMAIN}";
      env.LOCKBOX_MASTER_KEY = "${TOOLJET_SECRET_KEY}";
      env.NODE_ENV = "production";
      break;
    case "moodle":
      env.MOODLE_DATABASE_TYPE = "mariadb";
      env.MOODLE_DATABASE_HOST = "moodle-db";
      env.MOODLE_DATABASE_NAME = "moodle";
      env.MOODLE_DATABASE_USER = "moodle";
      env.MOODLE_DATABASE_PASSWORD = "${MOODLE_DB_PASSWORD}";
      env.MOODLE_USERNAME = "${MOODLE_USERNAME:-admin}";
      env.MOODLE_PASSWORD = "${MOODLE_PASSWORD}";
      env.MOODLE_EMAIL = "${ADMIN_EMAIL}";
      env.MOODLE_SITE_NAME = "${MOODLE_SITE_NAME:-Learning}";
      break;
    case "findr":
      env.SURREALDB_URL = "http://surrealdb:8000/rpc";
      env.OPENSEARCH_URL = "http://opensearch:9200";
      env.REDIS_URL = "redis://:${REDIS_PASSWORD}@redis:6379/6";
      env.AUTH_REQUIRED = "false";
      env.TRUSTED_SHARED_SECRET = "${FINDR_SECRET}";
      break;
    case "claude-agent":
      env.ANTHROPIC_API_KEY = "${ANTHROPIC_API_KEY}";
      env.CLAUDE_AGENT_API_KEY = "${CLAUDE_AGENT_API_KEY}";
      env.PORT = "${CLAUDE_AGENT_PORT:-3100}";
      break;
    case "langfuse":
      env.DATABASE_URL = "postgresql://${POSTGRES_USER:-saas}:${POSTGRES_PASSWORD}@postgres:5432/langfuse";
      env.NEXTAUTH_URL = "https://observe.${DOMAIN}";
      env.NEXTAUTH_SECRET = "${LANGFUSE_SECRET_KEY}";
      env.SALT = "${LANGFUSE_SALT}";
      env.TELEMETRY_ENABLED = "${LANGFUSE_TELEMETRY_ENABLED:-false}";
      env.LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES = "true";
      break;
  }

  return env;
}

function buildPortMappings(mod: ModuleDefinition): string[] {
  return Object.entries(mod.ports).map(([_name, port]) => {
    const envKey = mod.envVars.find(v => v.key.includes("PORT") && v.default === String(port));
    if (envKey) {
      return `\${${envKey.key}:-${port}}:${port}`;
    }
    return `${port}:${port}`;
  });
}

function buildDependsOn(mod: ModuleDefinition): Record<string, { condition: string }> {
  const deps: Record<string, { condition: string }> = {};
  for (const depId of mod.dependencies) {
    deps[depId] = { condition: "service_healthy" };
  }
  return deps;
}

function buildHealthCheck(mod: ModuleDefinition) {
  const hc = mod.healthCheck!;
  const interval = `${hc.intervalSeconds || 15}s`;

  let test: string[];
  switch (hc.method) {
    case "pg_isready":
      test = ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-saas}"];
      break;
    case "redis-ping":
      test = ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"];
      break;
    case "mongosh":
      test = ["CMD-SHELL", `mongosh --eval "db.adminCommand('ping')" --quiet || exit 1`];
      break;
    case "ollama-check":
      test = ["CMD-SHELL", `curl -sf http://localhost:${hc.port}/ | grep -q Ollama || exit 1`];
      break;
    default:
      if (mod.id === "logto") {
        test = ["CMD-SHELL", `wget -q --spider http://localhost:${hc.port}${hc.path} || exit 1`];
      } else if (mod.id === "rustfs") {
        test = ["CMD-SHELL", `curl -s -o /dev/null -w '%{http_code}' http://localhost:${hc.port}/ | grep -qE '^(200|403)' || exit 1`];
      } else {
        test = ["CMD-SHELL", `curl -f http://localhost:${hc.port}${hc.path} || exit 1`];
      }
  }

  return { test, interval, timeout: "5s", retries: 5 };
}

function buildSidecar(sidecar: NonNullable<ModuleDefinition["sidecars"]>[0], parent: ModuleDefinition): ComposeService {
  const service: ComposeService = {
    image: sidecar.image,
    restart: "unless-stopped",
    networks: ["saas-internal"],
  };

  if (parent.group !== "essential") {
    service.profiles = [parent.group];
  }

  if (sidecar.volumes.length > 0) {
    service.volumes = [...sidecar.volumes];
  }

  // Build env for sidecars
  const env: Record<string, string> = {};
  if (parent.id === "matomo") {
    env.MARIADB_ROOT_PASSWORD = "${MATOMO_DB_ROOT_PASSWORD}";
    env.MARIADB_DATABASE = "matomo";
    env.MARIADB_USER = "matomo";
    env.MARIADB_PASSWORD = "${MATOMO_DB_PASSWORD}";
  } else if (sidecar.name === "moodle-db") {
    env.MARIADB_ROOT_PASSWORD = "${MOODLE_DB_ROOT_PASSWORD}";
    env.MARIADB_DATABASE = "moodle";
    env.MARIADB_USER = "moodle";
    env.MARIADB_PASSWORD = "${MOODLE_DB_PASSWORD}";
  } else if (sidecar.name === "librechat-mongodb") {
    env.MONGO_INITDB_ROOT_USERNAME = "librechat";
    env.MONGO_INITDB_ROOT_PASSWORD = "${LIBRECHAT_MONGODB_PASSWORD}";
  } else if (sidecar.name === "librechat-meilisearch") {
    env.MEILI_MASTER_KEY = "${MEILI_MASTER_KEY}";
    env.MEILI_NO_ANALYTICS = "true";
  }
  if (Object.keys(env).length > 0) {
    service.environment = env;
  }

  if (sidecar.healthCheck) {
    if (sidecar.name === "librechat-mongodb") {
      service.healthcheck = {
        test: ["CMD-SHELL", `mongosh --eval "db.adminCommand('ping')" --quiet || exit 1`],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      };
    } else if (sidecar.name === "librechat-meilisearch") {
      service.healthcheck = {
        test: ["CMD-SHELL", "curl -f http://localhost:7700/health || exit 1"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      };
    } else {
      service.healthcheck = {
        test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      };
    }
  }

  return service;
}

function applySpecialConfig(mod: ModuleDefinition, service: ComposeService) {
  switch (mod.id) {
    case "redis":
      service.command = "redis-server --requirepass ${REDIS_PASSWORD:?Set REDIS_PASSWORD in .env}";
      break;
    case "rustfs":
      service.command = 'server /data --console-address ":9001"';
      break;
  }
}
