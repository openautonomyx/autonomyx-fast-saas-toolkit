# Contributing

Thanks for your interest in the Autonomyx Fast SaaS Toolkit.

## Prerequisites

- Node.js 22+ (recommend [fnm](https://github.com/Schniz/fnm))
- pnpm 10+
- Docker Engine 24+ and Docker Compose v2
- Git

## Development Setup

```bash
git clone https://github.com/openautonomyx/autonomyx-fast-saas-toolkit.git
cd autonomyx-fast-saas-toolkit
pnpm install
```

## Build

```bash
pnpm --filter @autonomyx/fast-saas build       # CLI
pnpm --filter @autonomyx/api build              # REST API
pnpm --filter @autonomyx/mcp-fast-saas build    # MCP server
pnpm --filter @autonomyx/saas-middleware build   # Middleware
```

## Test

```bash
# CLI catalog
node packages/cli/dist/index.js catalog

# CLI init (interactive)
node packages/cli/dist/index.js init test-project

# API (requires Docker)
cd packages/starter && docker compose up -d postgres redis
cd ../.. && node packages/api/dist/index.js
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/plans

# Validate Docker Compose
docker compose -f packages/starter/docker-compose.yml config --quiet
```

## Project Map

| Package | What | Language |
|---|---|---|
| `packages/cli/` | CLI scaffolding tool (22 modules, 9 commands) | TypeScript |
| `packages/api/` | REST API server (38 endpoints) | TypeScript/Express |
| `packages/mcp/` | MCP server (44 tools) | TypeScript |
| `packages/starter/middleware/` | Multi-tenancy middleware (6 modules) | TypeScript |
| `packages/starter/` | Docker Compose stack (25 services) | YAML/Config |
| `packages/skill/` | Claude Code skill (5 modes) | Markdown |
| `docs/` | Documentation (15 files) | Markdown |

## Adding a New Module

1. **Registry** -- Define in `packages/cli/src/modules/registry.ts` (ModuleDefinition)
2. **Compose env** -- Add case in `packages/cli/src/generators/compose.ts` buildEnvironment()
3. **Docker service** -- Add to `packages/starter/docker-compose.yml` with profile
4. **Caddy route** -- Add to `packages/starter/Caddyfile`
5. **Env vars** -- Add to `packages/starter/.env.example`
6. **Database** -- Add to `packages/starter/scripts/setup.sh` if using PostgreSQL
7. **Service README** -- Create `packages/starter/services/<name>/README.md`
8. **API routes** (optional) -- Add to `packages/api/src/routes/`
9. **MCP tools** (optional) -- Add to `packages/mcp/src/index.ts`
10. **Docs** (optional) -- Add to `docs/modules/`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new module for X
fix: correct health check for Y
docs: update deployment guide
refactor: simplify compose generator
```

## Pull Requests

- One feature per PR
- Update docs if you change behavior
- Build must pass: `pnpm --filter @autonomyx/fast-saas build`
- Follow existing code patterns
- Add README for new services

## Module Groups

| Group | Profile | Default | Purpose |
|---|---|---|---|
| essential | `essential` | Always on | PostgreSQL, Redis, Caddy |
| core | `core` | On | Auth, billing, storage, API |
| ops | `ops` | On | Error tracking, monitoring, metrics |
| growth | `growth` | Opt-in | Analytics, email, admin, workflows |
| ai | `ai` | Opt-in | LLM chat, workflows, models, agents |

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
