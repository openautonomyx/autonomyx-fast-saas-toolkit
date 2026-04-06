# Autonomyx Fast SaaS Toolkit

## Project Structure
- `packages/cli/` — CLI scaffolding tool (`@autonomyx/fast-saas`)
- `packages/starter/` — Reference Docker Compose stack with all services
- `packages/starter/middleware/` — TypeScript multi-tenancy middleware
- `packages/skill/` — Claude Code skill for interactive setup
- `docs/` — Documentation

## Tech Stack
- **Monorepo**: pnpm workspaces
- **CLI**: TypeScript + commander.js + @inquirer/prompts + handlebars
- **Middleware**: TypeScript (Node 22+)
- **Infrastructure**: Docker Compose with profiles
- **Reverse Proxy**: Caddy (auto-HTTPS)

## OSS Services Bundled
Essential: PostgreSQL 16, Redis 7, Caddy
Core: Logto (auth), Lago (billing), RustFS (S3 storage)
Ops: GlitchTip, Uptime Kuma, Grafana + Prometheus + Loki
Growth: Matomo, PostHog, Mautic, Stalwart, NocoDB, n8n, Docmost, Appsmith

## Commands
```
pnpm install              # Install all workspace deps
pnpm --filter cli build   # Build CLI
pnpm --filter cli dev     # Dev mode for CLI
```

## Conventions
- Docker Compose profiles: `essential`, `core`, `ops`, `growth`
- Environment variables: root `.env` with shared values, `services/<name>/` for service-specific
- All secrets auto-generated via `crypto.randomBytes(32)`
- Handlebars templates in `packages/cli/templates/`
