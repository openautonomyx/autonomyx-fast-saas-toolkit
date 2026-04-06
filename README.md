# Autonomyx Fast SaaS Toolkit

[![CI](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@autonomyx/fast-saas)](https://www.npmjs.com/package/@autonomyx/fast-saas)

Launch an enterprise SaaS product in minutes, not months. Pre-wired Docker Compose stack with 17 open-source tools covering auth, billing, monitoring, analytics, email, admin, and workflow automation.

## What's Included

| Layer | Services | Default |
|---|---|---|
| **Essential** | PostgreSQL 16, Redis 7, Caddy | Always on |
| **Core** | Logto (auth/SSO), Lago (billing), RustFS (S3 storage) | On |
| **Ops** | GlitchTip (errors), Uptime Kuma (status), Grafana + Prometheus + Loki (metrics) | On |
| **Growth** | Matomo, PostHog, Mautic, Stalwart, NocoDB, n8n, Appsmith, Docmost | Opt-in |

## Quick Start

### Option A: CLI (recommended)

```bash
npm install -g @autonomyx/fast-saas
fast-saas init my-saas
cd my-saas && make up
```

### Option B: Clone starter

```bash
git clone https://github.com/openautonomyx/autonomyx-fast-saas-toolkit.git
cd autonomyx-fast-saas-toolkit/packages/starter
cp .env.example .env    # Edit with your domain + secrets
make setup && make up
```

### Option C: Claude Code skill

```
/fast-saas-toolkit
> scaffold a new SaaS project called acme
```

## Architecture

```
Internet → Caddy (:80/:443, auto-HTTPS)
  ├── auth.DOMAIN        → Logto        (SSO/RBAC)
  ├── billing.DOMAIN     → Lago         (subscriptions)
  ├── monitor.DOMAIN     → Grafana      (dashboards)
  ├── errors.DOMAIN      → GlitchTip    (Sentry-compatible)
  ├── status.DOMAIN      → Uptime Kuma  (status page)
  ├── analytics.DOMAIN   → Matomo       (web analytics)
  ├── email.DOMAIN       → Mautic       (marketing)
  ├── admin.DOMAIN       → NocoDB       (admin dashboard)
  ├── auto.DOMAIN        → n8n          (workflows)
  ├── storage.DOMAIN     → RustFS       (S3 storage)
  ├── docs.DOMAIN        → Docmost      (knowledge base)
  └── app.DOMAIN         → Your App

Internal: PostgreSQL + Redis (shared Docker bridge)
```

## Multi-Tenancy Middleware

The `@autonomyx/saas-middleware` TypeScript package provides:

- **Auth Guard** — Validates Logto JWTs and API keys (OIDC/JWKS)
- **Tenant Context** — Resolves tenant from JWT, loads plan and settings
- **Rate Limiter** — Sliding-window per-tenant limits via Redis sorted sets
- **Usage Tracker** — Buffers API events, flushes to PostgreSQL, forwards to Lago
- **Feature Flags** — Plan-based gating (free / starter / pro / enterprise)
- **Health Check** — PostgreSQL + Redis connectivity endpoint

```typescript
import { createAuthGuard, createTenantContext, createRateLimiter } from '@autonomyx/saas-middleware';

app.use(createAuthGuard({ logtoEndpoint: 'https://auth.example.com/oidc' }));
app.use(createTenantContext({ db }));
app.use(createRateLimiter({ redis }));
```

## Pre-Built Automation

### Grafana Dashboards (4)
SaaS Overview | Tenant Usage | Infrastructure | Billing Overview

### Prometheus Alerts (10)
ServiceDown | HighErrorRate | HighLatency | HighCPU | HighMemory | DiskSpaceLow | PostgresConnectionsHigh | RedisMemoryHigh | TenantOverLimit | BillingWebhookFailure

### n8n Workflows (6)
Welcome Email | Usage Alert | Error Alert | Daily Backup | Billing Sync | Onboarding Drip

## CLI Commands

```
fast-saas init [name]     # Interactive project scaffolding
fast-saas catalog         # List all 17 modules
fast-saas add <module>    # Add a module (resolves dependencies)
fast-saas remove <module> # Remove a module (checks dependents)
fast-saas up [--detach]   # Start services
fast-saas down            # Stop services
fast-saas health          # Health check all services
fast-saas env [--regen]   # Validate/regenerate .env
```

## Claude Code Skill

The `/fast-saas-toolkit` skill has 5 modes:

| Mode | Trigger | What it does |
|---|---|---|
| **Scaffold** | "create a SaaS project" | Interactive project generation |
| **Configure** | "set up billing plans" | Programs services via 8 MCP servers |
| **Convert** | "turn this into a SaaS" | Wraps oss-to-saas with pre-wired services |
| **Deploy** | "deploy to production" | Wraps deploy-to-coolify with pre-flight checks |
| **Diagnose** | "why is auth down?" | Health checks, log analysis, troubleshooting |

## Project Structure

```
packages/
  cli/                  # @autonomyx/fast-saas CLI (TypeScript)
  starter/              # Docker Compose reference stack
    docker-compose.yml  # 17 services with profiles
    Caddyfile           # Reverse proxy (14 subdomain routes)
    middleware/          # @autonomyx/saas-middleware
    migrations/          # PostgreSQL schema (5 tables)
    scripts/             # setup, seed, backup, health-check
    n8n-workflows/       # 6 pre-built workflow templates
    grafana-dashboards/  # 4 pre-built dashboards
    services/            # Per-service configs + READMEs
  skill/                # Claude Code skill + config templates
docs/                   # 15 documentation files
  modules/              # Per-module integration guides
  templates/            # Launch checklist, pricing page, investor metrics
```

## Resource Requirements

| Profile | vCPU | RAM | Disk | Est. Cost/mo |
|---|---|---|---|---|
| Minimal (essential + core) | 2 | 4 GB | 20 GB | ~$12-24 |
| Standard (+ ops) | 3 | 6 GB | 30 GB | ~$18-36 |
| Full (+ all growth) | 4 | 8 GB | 40 GB | ~$24-48 |

## Documentation

- [Quick Start](docs/index.md)
- [Architecture](docs/architecture.md)
- [CLI Reference](docs/cli-reference.md)
- [Module Guides](docs/modules/)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Customization](docs/customization.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Launch Checklist](docs/templates/launch-checklist.md)
- [Pricing Page Template](docs/templates/pricing-page.md)
- [Investor Metrics Template](docs/templates/investor-metrics.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
