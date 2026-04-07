/**
 * `fast-saas catalog` — List all available modules.
 */

import chalk from "chalk";
import { MODULE_GROUPS, getModulesByGroup, type ModuleGroup } from "../modules/registry.js";

export function catalogCommand() {
  console.log("");
  console.log(chalk.bold("  Autonomyx Fast SaaS Toolkit — Module Catalog"));
  console.log("");

  const groupLabels: Record<ModuleGroup, string> = {
    essential: "Essential (always included)",
    core: "Core (default on)",
    ops: "Ops (default on)",
    growth: "Growth (opt-in)",
    ai: "AI (opt-in — next-gen LLM layer)",
  };

  for (const [group, label] of Object.entries(groupLabels) as [ModuleGroup, string][]) {
    const modules = getModulesByGroup(group);
    console.log(chalk.bold(`  ${label}`));

    for (const mod of modules) {
      const routes = mod.caddyRoutes.map(r => `${r.subdomain}.\${DOMAIN}`).join(", ");
      const deps = mod.dependencies.length > 0 ? chalk.dim(` (needs: ${mod.dependencies.join(", ")})`) : "";

      console.log(`    ${chalk.cyan(mod.id.padEnd(16))} ${mod.description}${deps}`);
      if (routes) {
        console.log(`    ${" ".repeat(16)} ${chalk.dim(`→ ${routes}`)}`);
      }
    }
    console.log("");
  }
}
