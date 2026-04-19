# Proposed Folder / Package Changes

## New Folders
- `docs/product/` — commercial product docs, roadmap, packaging, launch materials.
- `packages/control-plane/` — hosted APIs for licenses, entitlements, release channels, support.
- `packages/website/` — marketing site and pricing pages.
- `packages/docs-site/` — docs portal (Docusaurus/Nextra/Astro Starlight).

## Starter + CLI Additions
- `packages/starter/scripts/preflight.sh` — environment readiness checks.
- `packages/starter/scripts/smoke-test.sh` — post-boot product health validation.
- `packages/starter/scripts/bootstrap.sh` — one-command setup flow.

## CLI Enhancements (proposed)
- `fast-saas bootstrap` -> runs preflight, setup, up, smoke tests.
- `fast-saas doctor` -> detailed diagnostics.
- `fast-saas deploy` -> deployment target abstraction (vps/coolify/docker).

## Config Standardization (proposed)
- `config/env.schema.json` (single source of truth).
- `config/profiles/*.yaml` (minimal/standard/growth/ai defaults).
- `config/domains.map.yaml` (subdomain map per module).
