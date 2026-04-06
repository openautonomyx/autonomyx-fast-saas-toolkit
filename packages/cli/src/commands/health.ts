/**
 * `fast-saas health` — Check status of all running services.
 */

import chalk from "chalk";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MODULE_REGISTRY } from "../modules/registry.js";
import { checkAllHealth } from "../utils/health-check.js";

interface ProjectManifest {
  modules: string[];
  domain: string;
}

export async function healthCommand() {
  const manifestPath = join(process.cwd(), ".fast-saas.json");

  if (!existsSync(manifestPath)) {
    console.log(chalk.red("  Not a Fast SaaS project. Run 'fast-saas init' first."));
    return;
  }

  const manifest: ProjectManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const modules = manifest.modules
    .map(id => MODULE_REGISTRY[id])
    .filter(Boolean);

  console.log("");
  console.log(chalk.bold("  Service Health Check"));
  console.log("");

  const results = await checkAllHealth(modules, manifest.domain);

  // Print table
  console.log(
    `  ${chalk.dim("SERVICE".padEnd(20))} ${chalk.dim("STATUS".padEnd(12))} ${chalk.dim("TIME".padEnd(10))} ${chalk.dim("GROUP")}`
  );
  console.log(`  ${"─".repeat(60)}`);

  for (const result of results) {
    const mod = MODULE_REGISTRY[result.moduleId];
    const group = mod?.group || "";

    let statusStr: string;
    switch (result.status) {
      case "healthy":
        statusStr = chalk.green("✓ UP".padEnd(12));
        break;
      case "unhealthy":
        statusStr = chalk.red(`✗ DOWN`.padEnd(12));
        break;
      case "skipped":
        statusStr = chalk.dim("- SKIP".padEnd(12));
        break;
    }

    const latency = result.latencyMs > 0 ? `${result.latencyMs}ms` : "-";

    console.log(
      `  ${result.name.padEnd(20)} ${statusStr} ${latency.padEnd(10)} ${chalk.dim(group)}`
    );

    if (result.error) {
      console.log(`  ${" ".repeat(20)} ${chalk.red(result.error)}`);
    }
  }

  const healthy = results.filter(r => r.status === "healthy").length;
  const total = results.filter(r => r.status !== "skipped").length;

  console.log("");
  console.log(`  ${healthy}/${total} services healthy`);
  console.log("");
}
