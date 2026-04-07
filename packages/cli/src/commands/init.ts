/**
 * `fast-saas init` — Interactive project scaffolding wizard.
 * Asks the user for project name, domain, modules, then generates
 * a complete Docker Compose project with all configs.
 */

import { input, checkbox, confirm } from "@inquirer/prompts";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import chalk from "chalk";
import {
  MODULE_REGISTRY,
  MODULE_GROUPS,
  getModulesByGroup,
  type ModuleDefinition,
} from "../modules/registry.js";
import { resolveModules } from "../modules/resolver.js";
import { generateEnvFile } from "../generators/env.js";
import { generateCaddyfile } from "../generators/caddy.js";
import { generateComposeFile } from "../generators/compose.js";

export async function initCommand(projectName?: string) {
  console.log("");
  console.log(chalk.bold("  Autonomyx Fast SaaS Toolkit"));
  console.log(chalk.dim("  Enterprise SaaS project scaffolding"));
  console.log("");

  // Step 1: Project name
  const name = projectName || await input({
    message: "Project name:",
    default: "my-saas",
    validate: (v) => /^[a-z0-9-]+$/.test(v) || "Use lowercase letters, numbers, and hyphens only",
  });

  const projectDir = resolve(process.cwd(), name);

  if (existsSync(projectDir)) {
    const overwrite = await confirm({
      message: `Directory ${name} already exists. Continue anyway?`,
      default: false,
    });
    if (!overwrite) {
      console.log(chalk.yellow("Aborted."));
      return;
    }
  }

  // Step 2: Domain and email
  const domain = await input({
    message: "Domain (e.g., myapp.com):",
    default: "localhost",
  });

  const adminEmail = await input({
    message: "Admin email:",
    validate: (v) => v.includes("@") || "Enter a valid email",
  });

  // Step 3: Module selection
  console.log("");
  console.log(chalk.bold("  Select modules to include:"));
  console.log(chalk.dim("  Essential (PostgreSQL, Redis, Caddy) is always included."));
  console.log("");

  // Core modules (default on)
  const coreModules = getModulesByGroup("core");
  const selectedCore = await checkbox({
    message: "Core modules:",
    choices: coreModules.map(m => ({
      name: `${m.name} — ${m.description}`,
      value: m.id,
      checked: m.defaultEnabled,
    })),
  });

  // Ops modules (default on)
  const opsModules = getModulesByGroup("ops");
  const selectedOps = await checkbox({
    message: "Ops modules:",
    choices: opsModules.map(m => ({
      name: `${m.name} — ${m.description}`,
      value: m.id,
      checked: m.defaultEnabled,
    })),
  });

  // Growth modules (opt-in)
  const growthModules = getModulesByGroup("growth");
  const selectedGrowth = await checkbox({
    message: "Growth modules (opt-in):",
    choices: growthModules.map(m => ({
      name: `${m.name} — ${m.description}`,
      value: m.id,
      checked: false,
    })),
  });

  // AI modules (opt-in)
  const aiModules = getModulesByGroup("ai");
  const selectedAi = await checkbox({
    message: "AI modules (next-gen LLM layer):",
    choices: aiModules.map(m => ({
      name: `${m.name} — ${m.description}`,
      value: m.id,
      checked: false,
    })),
  });

  // Resolve all modules with dependencies
  const allSelected = [...selectedCore, ...selectedOps, ...selectedGrowth, ...selectedAi];
  const { ordered, autoAdded } = resolveModules(allSelected);

  if (autoAdded.length > 0) {
    console.log("");
    console.log(
      chalk.yellow(`  Auto-added dependencies: ${autoAdded.map(id => MODULE_REGISTRY[id]?.name || id).join(", ")}`)
    );
  }

  // Determine active profiles
  const profiles = ["essential"];
  if (selectedCore.length > 0) profiles.push("core");
  if (selectedOps.length > 0) profiles.push("ops");
  if (selectedGrowth.length > 0) profiles.push("growth");
  if (selectedAi.length > 0) profiles.push("ai");

  // Step 4: Generate project
  console.log("");
  console.log(chalk.bold("  Generating project..."));

  // Create directories
  const dirs = [
    "",
    "services",
    "migrations",
    "scripts",
    "n8n-workflows",
    "grafana-dashboards",
  ];
  for (const dir of dirs) {
    mkdirSync(join(projectDir, dir), { recursive: true });
  }

  // Create service config directories
  for (const mod of ordered) {
    if (mod.group !== "essential") {
      mkdirSync(join(projectDir, "services", mod.id), { recursive: true });
    }
  }

  // Generate .env
  const envContent = generateEnvFile(ordered, { domain, adminEmail, profiles });
  writeFileSync(join(projectDir, ".env"), envContent);
  writeFileSync(join(projectDir, ".env.example"), envContent.replace(/=([a-f0-9]{64}|[a-zA-Z0-9]{24})/g, "=CHANGE_ME"));
  console.log(chalk.green("  ✓ .env"));

  // Generate docker-compose.yml
  const composeContent = generateComposeFile(ordered);
  writeFileSync(join(projectDir, "docker-compose.yml"), composeContent);
  console.log(chalk.green("  ✓ docker-compose.yml"));

  // Generate Caddyfile
  const caddyContent = generateCaddyfile(ordered);
  writeFileSync(join(projectDir, "Caddyfile"), caddyContent);
  console.log(chalk.green("  ✓ Caddyfile"));

  // Copy static files from the starter template if available
  const starterDir = findStarterDir();
  if (starterDir) {
    copyStaticFiles(starterDir, projectDir, ordered);
  } else {
    // Generate minimal versions
    generateMinimalFiles(projectDir, ordered, profiles);
  }

  // Generate .gitignore
  writeFileSync(join(projectDir, ".gitignore"), [
    "node_modules/",
    ".env",
    "!.env.example",
    "*.log",
    ".DS_Store",
    "backups/",
  ].join("\n"));
  console.log(chalk.green("  ✓ .gitignore"));

  // Save module manifest for add/remove commands
  const manifest = {
    name,
    domain,
    adminEmail,
    modules: ordered.map(m => m.id),
    profiles,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(join(projectDir, ".fast-saas.json"), JSON.stringify(manifest, null, 2));
  console.log(chalk.green("  ✓ .fast-saas.json (project manifest)"));

  // Summary
  console.log("");
  console.log(chalk.bold.green("  ✅ Project created!"));
  console.log("");
  console.log(`  ${chalk.bold("Directory:")} ${projectDir}`);
  console.log(`  ${chalk.bold("Modules:")}  ${ordered.length} services`);
  console.log(`  ${chalk.bold("Profiles:")} ${profiles.join(", ")}`);
  console.log("");
  console.log(chalk.bold("  Next steps:"));
  console.log(`  ${chalk.cyan("cd")} ${name}`);
  console.log(`  ${chalk.cyan("docker compose")} --profile essential --profile core --profile ops up -d`);
  console.log(`  ${chalk.cyan("./scripts/setup.sh")}   ${chalk.dim("# Create service databases")}`);
  console.log(`  ${chalk.cyan("./scripts/health-check.sh")} ${chalk.dim("# Verify all services")}`);
  console.log("");

  if (domain !== "localhost") {
    console.log(chalk.bold("  Service URLs:"));
    for (const mod of ordered) {
      for (const route of mod.caddyRoutes) {
        console.log(`  ${chalk.dim("•")} ${mod.name}: https://${route.subdomain}.${domain}`);
      }
    }
    console.log("");
  }
}

function findStarterDir(): string | undefined {
  // Look for the starter package relative to the CLI
  const candidates = [
    join(import.meta.dirname || "", "../../starter"),
    join(process.cwd(), "packages/starter"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "Makefile"))) return dir;
  }
  return undefined;
}

function copyStaticFiles(starterDir: string, projectDir: string, modules: ModuleDefinition[]) {
  const filesToCopy = [
    "Makefile",
    "scripts/setup.sh",
    "scripts/health-check.sh",
    "scripts/seed.sh",
    "scripts/backup.sh",
  ];

  // Copy migration files
  const migrationsDir = join(starterDir, "migrations");
  if (existsSync(migrationsDir)) {
    const { readdirSync } = require("fs");
    for (const file of readdirSync(migrationsDir)) {
      mkdirSync(join(projectDir, "migrations"), { recursive: true });
      copyFileSync(join(migrationsDir, file), join(projectDir, "migrations", file));
    }
    console.log(chalk.green("  ✓ migrations/"));
  }

  for (const file of filesToCopy) {
    const src = join(starterDir, file);
    if (existsSync(src)) {
      mkdirSync(join(projectDir, file, ".."), { recursive: true });
      copyFileSync(src, join(projectDir, file));
    }
  }
  console.log(chalk.green("  ✓ scripts/"));

  // Copy Grafana provisioning if grafana-stack is selected
  if (modules.some(m => m.id === "grafana-stack")) {
    const grafanaDirs = ["services/grafana/provisioning/datasources", "services/grafana/provisioning/dashboards", "services/prometheus", "services/loki"];
    for (const dir of grafanaDirs) {
      mkdirSync(join(projectDir, dir), { recursive: true });
    }
    const grafanaFiles = [
      "services/grafana/provisioning/datasources/datasources.yml",
      "services/grafana/provisioning/dashboards/dashboards.yml",
      "services/prometheus/prometheus.yml",
      "services/loki/loki-config.yml",
    ];
    for (const file of grafanaFiles) {
      const src = join(starterDir, file);
      if (existsSync(src)) copyFileSync(src, join(projectDir, file));
    }
    console.log(chalk.green("  ✓ Grafana provisioning"));
  }

  // Copy n8n workflows if n8n is selected
  if (modules.some(m => m.id === "n8n")) {
    const n8nDir = join(starterDir, "n8n-workflows");
    if (existsSync(n8nDir)) {
      const { readdirSync } = require("fs");
      for (const file of readdirSync(n8nDir)) {
        copyFileSync(join(n8nDir, file), join(projectDir, "n8n-workflows", file));
      }
      console.log(chalk.green("  ✓ n8n workflows"));
    }
  }

  // Copy Grafana dashboards
  const dashDir = join(starterDir, "grafana-dashboards");
  if (existsSync(dashDir)) {
    const { readdirSync } = require("fs");
    for (const file of readdirSync(dashDir)) {
      copyFileSync(join(dashDir, file), join(projectDir, "grafana-dashboards", file));
    }
    console.log(chalk.green("  ✓ Grafana dashboards"));
  }
}

function generateMinimalFiles(projectDir: string, modules: ModuleDefinition[], profiles: string[]) {
  // Minimal Makefile
  const profileFlags = profiles.map(p => `--profile ${p}`).join(" ");
  writeFileSync(join(projectDir, "Makefile"), [
    `.PHONY: up down health`,
    ``,
    `up:`,
    `\tdocker compose ${profileFlags} up -d`,
    ``,
    `down:`,
    `\tdocker compose ${profileFlags} down`,
    ``,
    `health:`,
    `\tdocker compose ps`,
  ].join("\n"));
  console.log(chalk.green("  ✓ Makefile"));
}
