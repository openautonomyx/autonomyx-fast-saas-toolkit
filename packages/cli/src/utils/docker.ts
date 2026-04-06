import { execSync, type ExecSyncOptions } from "node:child_process";

const execOpts: ExecSyncOptions = { encoding: "utf-8", stdio: "pipe" };

/** Check if Docker is running */
export function isDockerRunning(): boolean {
  try {
    execSync("docker info", { ...execOpts, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Check if docker compose is available */
export function hasDockerCompose(): boolean {
  try {
    execSync("docker compose version", { ...execOpts, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Run docker compose command in a directory */
export function dockerCompose(
  args: string,
  cwd: string,
  profiles: string[] = []
): string {
  const profileFlags = profiles.map(p => `--profile ${p}`).join(" ");
  const cmd = `docker compose ${profileFlags} ${args}`;
  return execSync(cmd, { ...execOpts, cwd }) as string;
}

/** Get running container statuses */
export function getContainerStatuses(cwd: string): Array<{ name: string; status: string; ports: string }> {
  try {
    const output = execSync(
      'docker compose ps --format "{{.Name}}|{{.Status}}|{{.Ports}}"',
      { ...execOpts, cwd }
    ) as string;

    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [name, status, ports] = line.split("|");
        return { name: name || "", status: status || "", ports: ports || "" };
      });
  } catch {
    return [];
  }
}
