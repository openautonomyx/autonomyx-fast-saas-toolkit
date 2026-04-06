/**
 * `fast-saas remove <module>` — Remove a module from an existing project.
 */

import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MODULE_REGISTRY } from "../modules/registry.js";
import { checkRemovalSafety, resolveModules } from "../modules/resolver.js";
import { generateComposeFile } from "../generators/compose.js";
import { generateCaddyfile } from "../generators/caddy.js";
import { generateEnvFile } from "../generators/env.js";

interface ProjectManifest {
  name: string;
  modules: string[];
  domain: string;
  adminEmail: string;
  profiles: string[];
  createdAt: string;
}

export async function removeCommand(moduleId: string) {
  const manifestPath = join(process.cwd(), ".fast-saas.json");

  if (!existsSync(manifestPath)) {
    console.log(chalk.red("  Not a Fast SaaS project. Run 'fast-saas init' first."));
    return;
  }

  const mod = MODULE_REGISTRY[moduleId];
  if (!mod) {
    console.log(chalk.red(`  Unknown module: ${moduleId}`));
    return;
  }

  if (mod.group === "essential") {
    console.log(chalk.red(`  Cannot remove essential module: ${mod.name}`));
    return;
  }

  const manifest: ProjectManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  if (!manifest.modules.includes(moduleId)) {
    console.log(chalk.yellow(`  Module ${moduleId} is not installed.`));
    return;
  }

  // Check for dependents
  const dependents = checkRemovalSafety(moduleId, manifest.modules);
  if (dependents.length > 0) {
    console.log(chalk.red(`\n  Cannot remove ${mod.name}. These modules depend on it:`));
    for (const depId of dependents) {
      console.log(`    ${chalk.dim("•")} ${MODULE_REGISTRY[depId]?.name || depId}`);
    }
    console.log("");
    return;
  }

  const ok = await confirm({
    message: `Remove ${mod.name}? (Data volumes will be preserved)`,
    default: true,
  });

  if (!ok) {
    console.log(chalk.yellow("  Aborted."));
    return;
  }

  // Remove module and re-resolve
  const remaining = manifest.modules.filter(id => id !== moduleId);
  const { ordered } = resolveModules(remaining.filter(id => !["postgres", "redis", "caddy"].includes(id)));

  // Regenerate configs
  writeFileSync(join(process.cwd(), "docker-compose.yml"), generateComposeFile(ordered));
  writeFileSync(join(process.cwd(), "Caddyfile"), generateCaddyfile(ordered));
  writeFileSync(join(process.cwd(), ".env"), generateEnvFile(ordered, {
    domain: manifest.domain,
    adminEmail: manifest.adminEmail,
    profiles: manifest.profiles,
  }));

  manifest.modules = ordered.map(m => m.id);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(chalk.green(`\n  ✓ Removed ${mod.name}`));
  console.log(chalk.dim("  Data volume preserved. Run 'docker volume rm <name>' to delete data."));
  console.log(chalk.dim("  Run 'fast-saas up' to apply changes."));
  console.log("");
}
