/**
 * `fast-saas up`, `fast-saas down` — Docker Compose lifecycle commands.
 */

import chalk from "chalk";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { isDockerRunning, hasDockerCompose, dockerCompose } from "../utils/docker.js";

interface ProjectManifest {
  profiles: string[];
}

function loadManifest(): ProjectManifest | null {
  const manifestPath = join(process.cwd(), ".fast-saas.json");
  if (!existsSync(manifestPath)) {
    console.log(chalk.red("  Not a Fast SaaS project. Run 'fast-saas init' first."));
    return null;
  }
  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

export function upCommand(options: { detach?: boolean }) {
  const manifest = loadManifest();
  if (!manifest) return;

  if (!isDockerRunning()) {
    console.log(chalk.red("  Docker is not running. Start Docker Desktop first."));
    return;
  }

  if (!hasDockerCompose()) {
    console.log(chalk.red("  docker compose is not available."));
    return;
  }

  console.log("");
  console.log(chalk.bold("  Starting services..."));
  console.log(chalk.dim(`  Profiles: ${manifest.profiles.join(", ")}`));
  console.log("");

  try {
    const args = options.detach !== false ? "up -d" : "up";
    const output = dockerCompose(args, process.cwd(), manifest.profiles);
    if (output.trim()) console.log(output);

    console.log(chalk.green("\n  ✓ Services starting. Run 'fast-saas health' to check status."));
  } catch (err) {
    console.log(chalk.red(`  Error: ${(err as Error).message}`));
  }
}

export function downCommand() {
  const manifest = loadManifest();
  if (!manifest) return;

  console.log("");
  console.log(chalk.bold("  Stopping services..."));

  try {
    dockerCompose("down", process.cwd(), manifest.profiles);
    console.log(chalk.green("  ✓ All services stopped. Data volumes preserved."));
  } catch (err) {
    console.log(chalk.red(`  Error: ${(err as Error).message}`));
  }

  console.log("");
}
