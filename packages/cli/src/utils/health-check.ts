import type { ModuleDefinition } from "../modules/registry.js";

interface HealthResult {
  moduleId: string;
  name: string;
  status: "healthy" | "unhealthy" | "skipped";
  latencyMs: number;
  url?: string;
  error?: string;
}

/**
 * Check health of a single module by hitting its health endpoint.
 */
export async function checkModuleHealth(
  mod: ModuleDefinition,
  domain: string
): Promise<HealthResult> {
  if (!mod.healthCheck) {
    return { moduleId: mod.id, name: mod.name, status: "skipped", latencyMs: 0 };
  }

  const hc = mod.healthCheck;

  // Special cases for non-HTTP checks
  if (hc.method === "pg_isready" || hc.method === "redis-ping" || hc.method === "mariadb-healthcheck") {
    return { moduleId: mod.id, name: mod.name, status: "skipped", latencyMs: 0 };
  }

  const url = `http://localhost:${hc.port}${hc.path}`;
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const latencyMs = Math.round(performance.now() - start);

    if (response.ok || response.status < 500) {
      return { moduleId: mod.id, name: mod.name, status: "healthy", latencyMs, url };
    }

    return {
      moduleId: mod.id,
      name: mod.name,
      status: "unhealthy",
      latencyMs,
      url,
      error: `HTTP ${response.status}`,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      moduleId: mod.id,
      name: mod.name,
      status: "unhealthy",
      latencyMs,
      url,
      error: (err as Error).message,
    };
  }
}

/**
 * Check health of all provided modules in parallel.
 */
export async function checkAllHealth(
  modules: ModuleDefinition[],
  domain: string
): Promise<HealthResult[]> {
  return Promise.all(modules.map(mod => checkModuleHealth(mod, domain)));
}
