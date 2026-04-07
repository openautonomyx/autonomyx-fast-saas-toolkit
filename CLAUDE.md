# Autonomyx Fast SaaS Toolkit

## Project Structure
- `packages/cli/` — CLI scaffolding tool (`@autonomyx/fast-saas`, 22 modules, 9 commands)
- `packages/api/` — REST API server (`@autonomyx/api`, 38 endpoints)
- `packages/mcp/` — MCP server (`@autonomyx/mcp-fast-saas`, 44 tools)
- `packages/starter/` — Reference Docker Compose stack (25 services)
- `packages/starter/middleware/` — TypeScript multi-tenancy middleware (6 modules)
- `packages/skill/` — Claude Code skill (5 modes)
- `docs/` — Documentation (15 files)

## Tech Stack
- **Monorepo**: pnpm workspaces
- **CLI**: TypeScript + commander.js + @inquirer/prompts + handlebars
- **API**: TypeScript + Express.js
- **MCP**: TypeScript + @modelcontextprotocol/sdk
- **Middleware**: TypeScript (Node 22+)
- **Infrastructure**: Docker Compose with profiles
- **Reverse Proxy**: Caddy (auto-HTTPS)

## Services (22 modules, 25 containers)
Essential: PostgreSQL 16, Redis 7, Caddy
Core: Logto (auth), Lago (billing), RustFS (S3 storage), SaaS API
Ops: GlitchTip, Uptime Kuma, Grafana + Prometheus + Loki
Growth: Matomo, PostHog, Mautic, Stalwart, NocoDB, n8n, Docmost, Appsmith
AI: LibreChat (+ MongoDB + Meilisearch sidecars), Langflow, Ollama, Claude Agent, Langfuse

## Build Commands
```
pnpm install                                    # Install all workspace deps
pnpm --filter @autonomyx/fast-saas build        # Build CLI
pnpm --filter @autonomyx/api build              # Build API
pnpm --filter @autonomyx/mcp-fast-saas build    # Build MCP
pnpm --filter @autonomyx/saas-middleware build   # Build middleware
```

## Conventions
- Docker Compose profiles: `essential`, `core`, `ops`, `growth`, `ai`
- Environment variables: root `.env` with shared values, `services/<name>/` for service-specific
- All secrets auto-generated via `crypto.randomBytes(32)`
- SMTP is provider-agnostic via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- API response envelope: `{ data, meta, error }`
- MCP tools prefixed: `fast_saas_*`
- Module definitions in `packages/cli/src/modules/registry.ts`
- Compose env handling in `packages/cli/src/generators/compose.ts` buildEnvironment()
