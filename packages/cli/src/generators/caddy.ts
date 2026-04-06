/**
 * Caddyfile generator.
 * Produces a reverse proxy config from selected modules' routes.
 */

import type { ModuleDefinition } from "../modules/registry.js";

export function generateCaddyfile(modules: ModuleDefinition[]): string {
  const lines: string[] = [
    "# Autonomyx Fast SaaS Toolkit — Caddy Reverse Proxy",
    "# Auto-generated — edit with care",
    "",
  ];

  // Group routes by module group
  const groups: Record<string, Array<{ mod: ModuleDefinition; route: { subdomain: string; target: string } }>> = {
    core: [],
    ops: [],
    growth: [],
  };

  for (const mod of modules) {
    for (const route of mod.caddyRoutes) {
      const groupKey = mod.group === "essential" ? "core" : mod.group;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({ mod, route });
    }
  }

  for (const [group, entries] of Object.entries(groups)) {
    if (entries.length === 0) continue;

    lines.push(`# ── ${group.charAt(0).toUpperCase() + group.slice(1)} ──────────────────────────────`);
    lines.push("");

    for (const { route } of entries) {
      lines.push(`${route.subdomain}.{$DOMAIN} {`);
      lines.push(`\treverse_proxy ${route.target}`);
      lines.push("}");
      lines.push("");
    }
  }

  // Placeholder for user's app
  lines.push("# ── Your Application ─────────────────────────");
  lines.push("");
  lines.push("# app.{$DOMAIN} {");
  lines.push("# \treverse_proxy your-app:PORT");
  lines.push("# }");
  lines.push("");

  return lines.join("\n");
}
