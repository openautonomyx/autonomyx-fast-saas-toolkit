/**
 * `fast-saas add <module>` — Add a module to an existing project.
 */

import chalk from "chalk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MODULE_REGISTRY } from "../modules/registry.js";
import { resolveModules } from "../modules/resolver.js";
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

export function addCommand(moduleId: string) {
  const manifestPath = join(process.cwd(), ".fast-saas.json");

  if (!existsSync(manifestPath)) {
    console.log(chalk.red("  Not a Fast SaaS project. Run 'fast-saas init' first."));
    return;
  }

  if (!MODULE_REGISTRY[moduleId]) {
    console.log(chalk.red(`  Unknown module: ${moduleId}`));
    console.log(chalk.dim("  Run 'fast-saas catalog' to see available modules."));
    return;
  }

  const manifest: ProjectManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  if (manifest.modules.includes(moduleId)) {
    console.log(chalk.yellow(`  Module ${moduleId} is already installed.`));
    return;
  }

  // Resolve with new module added
  const newModuleIds = [...manifest.modules, moduleId];
  const { ordered, autoAdded } = resolveModules(newModuleIds);

  if (autoAdded.length > 0) {
    const newDeps = autoAdded.filter(id => !manifest.modules.includes(id));
    if (newDeps.length > 0) {
      console.log(chalk.yellow(`\n  Auto-adding dependencies: ${newDeps.map(id => MODULE_REGISTRY[id]?.name || id).join(", ")}`));
    }
  }

  // Update profiles
  const mod = MODULE_REGISTRY[moduleId];
  if (mod.group !== "essential" && !manifest.profiles.includes(mod.group)) {
    manifest.profiles.push(mod.group);
  }

  // Regenerate configs
  const composeContent = generateComposeFile(ordered);
  writeFileSync(join(process.cwd(), "docker-compose.yml"), composeContent);

  const caddyContent = generateCaddyfile(ordered);
  writeFileSync(join(process.cwd(), "Caddyfile"), caddyContent);

  const envContent = generateEnvFile(ordered, {
    domain: manifest.domain,
    adminEmail: manifest.adminEmail,
    profiles: manifest.profiles,
  });
  writeFileSync(join(process.cwd(), ".env"), envContent);

  // Update manifest
  manifest.modules = ordered.map(m => m.id);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(chalk.green(`\n  ✓ Added ${mod.name}`));
  console.log(chalk.dim(`  Run 'fast-saas up' to start the new service.`));
  console.log("");
}
