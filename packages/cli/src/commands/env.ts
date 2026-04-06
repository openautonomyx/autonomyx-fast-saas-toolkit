/**
 * `fast-saas env` — Validate and optionally regenerate .env secrets.
 */

import chalk from "chalk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MODULE_REGISTRY } from "../modules/registry.js";
import { parseEnvFile, validateEnv, generateEnvFile } from "../generators/env.js";

interface ProjectManifest {
  modules: string[];
  domain: string;
  adminEmail: string;
  profiles: string[];
}

export function envCommand(options: { regenerate?: boolean }) {
  const manifestPath = join(process.cwd(), ".fast-saas.json");
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(manifestPath)) {
    console.log(chalk.red("  Not a Fast SaaS project. Run 'fast-saas init' first."));
    return;
  }

  const manifest: ProjectManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const modules = manifest.modules.map(id => MODULE_REGISTRY[id]).filter(Boolean);

  if (options.regenerate) {
    console.log(chalk.bold("\n  Regenerating .env with fresh secrets..."));
    const envContent = generateEnvFile(modules, {
      domain: manifest.domain,
      adminEmail: manifest.adminEmail,
      profiles: manifest.profiles,
    });
    writeFileSync(envPath, envContent);
    console.log(chalk.green("  ✓ .env regenerated with new secrets\n"));
    return;
  }

  // Validate existing .env
  if (!existsSync(envPath)) {
    console.log(chalk.red("  .env file not found. Run 'fast-saas env --regenerate' to create one.\n"));
    return;
  }

  const envContent = readFileSync(envPath, "utf-8");
  const envMap = parseEnvFile(envContent);
  const issues = validateEnv(modules, envMap);

  console.log(chalk.bold("\n  Environment Validation"));
  console.log("");

  if (issues.length === 0) {
    console.log(chalk.green("  ✓ All environment variables are set correctly."));
  } else {
    console.log(chalk.yellow(`  ⚠ ${issues.length} issue(s) found:\n`));
    for (const issue of issues) {
      console.log(`  ${chalk.red("•")} ${chalk.bold(issue.key)} (${issue.module}): ${issue.issue}`);
    }
    console.log(chalk.dim("\n  Run 'fast-saas env --regenerate' to generate fresh secrets."));
  }

  console.log("");
}
