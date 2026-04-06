#!/usr/bin/env node

/**
 * @autonomyx/fast-saas — CLI for the Autonomyx Fast SaaS Toolkit
 *
 * Scaffold, manage, and deploy enterprise SaaS projects with
 * 17 pre-wired open-source tools.
 */

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { catalogCommand } from "./commands/catalog.js";
import { healthCommand } from "./commands/health.js";
import { upCommand, downCommand } from "./commands/lifecycle.js";
import { envCommand } from "./commands/env.js";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";

const program = new Command();

program
  .name("fast-saas")
  .description("Autonomyx Fast SaaS Toolkit — Enterprise SaaS scaffolding CLI")
  .version("0.1.0");

program
  .command("init [name]")
  .description("Scaffold a new SaaS project")
  .action(async (name?: string) => {
    await initCommand(name);
  });

program
  .command("catalog")
  .description("List all available modules")
  .action(() => {
    catalogCommand();
  });

program
  .command("add <module>")
  .description("Add a module to the current project")
  .action((moduleId: string) => {
    addCommand(moduleId);
  });

program
  .command("remove <module>")
  .description("Remove a module from the current project")
  .action(async (moduleId: string) => {
    await removeCommand(moduleId);
  });

program
  .command("up")
  .description("Start all enabled services")
  .option("-d, --detach", "Run in background (default)", true)
  .action((options) => {
    upCommand(options);
  });

program
  .command("down")
  .description("Stop all services (preserves data)")
  .action(() => {
    downCommand();
  });

program
  .command("health")
  .description("Check health of all running services")
  .action(async () => {
    await healthCommand();
  });

program
  .command("env")
  .description("Validate environment variables")
  .option("--regenerate", "Regenerate .env with fresh secrets")
  .action((options) => {
    envCommand(options);
  });

program.parse();
