/**
 * Dependency Resolver — ensures all required modules are included
 * when a user selects modules. Performs topological sort for
 * correct startup ordering in Docker Compose.
 */

import { MODULE_REGISTRY, type ModuleDefinition } from "./registry.js";

export interface ResolvedModules {
  /** All modules in dependency order (dependencies first) */
  ordered: ModuleDefinition[];
  /** Module IDs that were auto-added as dependencies */
  autoAdded: string[];
}

/**
 * Given a set of selected module IDs, resolve all transitive dependencies
 * and return them in topological order (dependencies before dependents).
 */
export function resolveModules(selectedIds: string[]): ResolvedModules {
  const resolved = new Set<string>();
  const autoAdded: string[] = [];

  function visit(id: string, isExplicit: boolean) {
    if (resolved.has(id)) return;

    const mod = MODULE_REGISTRY[id];
    if (!mod) {
      throw new Error(`Unknown module: ${id}`);
    }

    // Visit dependencies first
    for (const depId of mod.dependencies) {
      if (!resolved.has(depId)) {
        if (!selectedIds.includes(depId)) {
          autoAdded.push(depId);
        }
        visit(depId, false);
      }
    }

    resolved.add(id);
  }

  // Always include essential modules
  for (const id of ["postgres", "redis", "caddy"]) {
    visit(id, true);
  }

  // Resolve user selections
  for (const id of selectedIds) {
    visit(id, true);
  }

  // Build ordered list (dependencies first)
  const ordered = Array.from(resolved)
    .map(id => MODULE_REGISTRY[id])
    .filter(Boolean);

  return { ordered, autoAdded };
}

/**
 * Validate that a set of modules can be removed without breaking dependencies.
 * Returns list of modules that depend on the one being removed.
 */
export function checkRemovalSafety(
  removeId: string,
  currentModuleIds: string[]
): string[] {
  const dependents: string[] = [];

  for (const id of currentModuleIds) {
    if (id === removeId) continue;
    const mod = MODULE_REGISTRY[id];
    if (mod?.dependencies.includes(removeId)) {
      dependents.push(id);
    }
  }

  return dependents;
}
