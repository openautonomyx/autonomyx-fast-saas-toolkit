/**
 * Environment file generator.
 * Collects all env vars from selected modules, generates secrets,
 * and produces a .env file.
 */

import type { ModuleDefinition } from "../modules/registry.js";
import { generateSecret } from "../utils/secrets.js";

export interface EnvConfig {
  domain: string;
  adminEmail: string;
  profiles: string[];
}

export function generateEnvFile(
  modules: ModuleDefinition[],
  config: EnvConfig
): string {
  const lines: string[] = [
    "# Autonomyx Fast SaaS Toolkit — Generated Environment",
    `# Generated at ${new Date().toISOString()}`,
    "",
    "# ── Global ────────────────────────────────────",
    `DOMAIN=${config.domain}`,
    `ADMIN_EMAIL=${config.adminEmail}`,
    `COMPOSE_PROFILES=${config.profiles.join(",")}`,
    "",
  ];

  // Group env vars by module
  const seenKeys = new Set<string>(["DOMAIN", "ADMIN_EMAIL", "COMPOSE_PROFILES"]);

  for (const mod of modules) {
    const modVars = mod.envVars.filter(v => !seenKeys.has(v.key));
    if (modVars.length === 0) continue;

    lines.push(`# ── ${mod.name} ──────────────────────────────`);

    for (const v of modVars) {
      seenKeys.add(v.key);
      let value: string;

      if (v.secret) {
        value = generateSecret();
      } else if (v.default !== undefined) {
        value = v.default;
      } else {
        value = "CHANGE_ME";
      }

      lines.push(`${v.key}=${value}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Parse an existing .env file into a key-value map.
 */
export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    map.set(trimmed.slice(0, eqIndex), trimmed.slice(eqIndex + 1));
  }
  return map;
}


function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikeDomain(value: string): boolean {
  if (value === "localhost") return true;
  return /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value);
}

function isWeakSecret(value: string): boolean {
  return value.length < 16 || /^(changeme|password|admin|123456)$/i.test(value);
}

/**
 * Validate that all required env vars are set and not placeholder values.
 */
export function validateEnv(
  modules: ModuleDefinition[],
  envMap: Map<string, string>
): Array<{ key: string; module: string; issue: string }> {
  const issues: Array<{ key: string; module: string; issue: string }> = [];

  for (const mod of modules) {
    for (const v of mod.envVars) {
      const value = envMap.get(v.key);

      if (v.required && (!value || value === "CHANGE_ME")) {
        issues.push({ key: v.key, module: mod.name, issue: "Missing or placeholder value" });
        continue;
      }

      if (value && v.secret && isWeakSecret(value)) {
        issues.push({ key: v.key, module: mod.name, issue: "Secret appears weak for production" });
      }
    }
  }

  // Check global required vars
  const domain = envMap.get("DOMAIN");
  if (!domain || domain === "CHANGE_ME" || domain === "example.com") {
    issues.push({ key: "DOMAIN", module: "Global", issue: "Missing or placeholder value" });
  } else if (!looksLikeDomain(domain)) {
    issues.push({ key: "DOMAIN", module: "Global", issue: "Invalid domain format" });
  }

  const adminEmail = envMap.get("ADMIN_EMAIL");
  if (!adminEmail || adminEmail === "CHANGE_ME") {
    issues.push({ key: "ADMIN_EMAIL", module: "Global", issue: "Missing or placeholder value" });
  } else if (!looksLikeEmail(adminEmail)) {
    issues.push({ key: "ADMIN_EMAIL", module: "Global", issue: "Invalid email format" });
  }

  return issues;
}
