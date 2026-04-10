# Autonomyx Fast SaaS Toolkit

[![CI](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@autonomyx/fast-saas)](https://www.npmjs.com/package/@autonomyx/fast-saas)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/openautonomyx)

Launch an enterprise SaaS product in minutes, not months. **22 open-source services** pre-wired with Docker Compose, a CLI scaffolding tool, a REST API, 44 MCP tools, and a Claude Code skill.

## What's Included

| Layer | Services | Default |
|---|---|---|
| **Essential** | PostgreSQL 16, Redis 7, Caddy | Always on |
| **Core** | Logto (auth/SSO), Lago (billing), RustFS (S3 storage), SaaS API | On |
| **Ops** | GlitchTip (errors), Uptime Kuma (status), Grafana + Prometheus + Loki (metrics) | On |
| **Growth** | Matomo, PostHog, Mautic, Stalwart, NocoDB, n8n, Appsmith, Docmost | Opt-in |
| **AI** | LibreChat, Langflow, Ollama, Claude Agent, Langfuse | Opt-in |

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
Internet --> Caddy (:80/:443, auto-HTTPS)
  |-- auth.DOMAIN        --> Logto        (SSO/RBAC)
  |-- billing.DOMAIN     --> Lago         (subscriptions)
  |-- api.DOMAIN         --> SaaS API     (38 endpoints)
  |-- monitor.DOMAIN     --> Grafana      (dashboards)
  |-- errors.DOMAIN      --> GlitchTip    (Sentry-compatible)
  |-- status.DOMAIN      --> Uptime Kuma  (status page)
  |-- analytics.DOMAIN   --> Matomo       (web analytics)
  |-- email.DOMAIN       --> Mautic       (marketing)
  |-- admin.DOMAIN       --> NocoDB       (admin dashboard)
  |-- auto.DOMAIN        --> n8n          (workflows)
  |-- storage.DOMAIN     --> RustFS       (S3 storage)
  |-- docs.DOMAIN        --> Docmost      (knowledge base)
  |-- chat.DOMAIN        --> LibreChat    (AI chat)
  |-- flow.DOMAIN        --> Langflow     (AI workflows)
  |-- models.DOMAIN      --> Ollama       (local LLMs)
  |-- agent.DOMAIN       --> Claude Agent (coding agent)
  |-- observe.DOMAIN     --> Langfuse     (LLM observability)
  |-- app.DOMAIN         --> Your App

Internal: PostgreSQL + Redis (shared Docker bridge)
```

## Multi-Tenancy Middleware

The `@autonomyx/saas-middleware` TypeScript package provides:

- **Auth Guard** -- Validates Logto JWTs and API keys (OIDC/JWKS)
- **Tenant Context** -- Resolves tenant from JWT, loads plan and settings
- **Rate Limiter** -- Sliding-window per-tenant limits via Redis sorted sets
- **Usage Tracker** -- Buffers API events, flushes to PostgreSQL, forwards to Lago
- **Feature Flags** -- Plan-based gating (free / starter / pro / enterprise)
- **Health Check** -- PostgreSQL + Redis connectivity endpoint

```typescript
import { createAuthGuard, createTenantContext, createRateLimiter } from '@autonomyx/saas-middleware';

app.use(createAuthGuard({ logtoEndpoint: 'https://auth.example.com/oidc' }));
app.use(createTenantContext({ db }));
app.use(createRateLimiter({ redis }));
```

## REST API (38 endpoints)

The SaaS API at `api.DOMAIN` provides programmatic management:

| Route | Endpoints | Purpose |
|---|---|---|
| `/health` | 1 | PostgreSQL + Redis probe |
| `/api/v1/plans` | 2 | List plans, check features |
| `/api/v1/tenants` | 6 | Full tenant CRUD + plan changes |
| `/api/v1/users` | 4 | User CRUD |
| `/api/v1/tenants/:id/members` | 4 | Team membership management |
| `/api/v1/tenants/:id/api-keys` | 3 | API key create/list/revoke |
| `/api/v1/tenants/:id/usage` | 2 | Usage summary + raw events |
| `/api/v1/admin` | 2 | Platform stats + module list |
| `/api/v1/ai/ollama` | 5 | Model management + inference |
| `/api/v1/ai/langflow` | 4 | Flow management + execution |
| `/api/v1/ai/claude` | 3 | Agent job management |
| `/api/v1/ai/langfuse` | 1 | LLM observability health |
| `/api/v1/ai/health` | 1 | AI services health overview |

## MCP Server (44 tools)

The `@autonomyx/mcp-fast-saas` server exposes 44 tools for Claude:

| Group | Tools | Examples |
|---|---|---|
| Tenant (6) | create, list, get, update, delete, change_plan | `fast_saas_create_tenant` |
| User (4) | create, list, get, update | `fast_saas_list_users` |
| Member (4) | list, add, update, remove | `fast_saas_add_member` |
| API Key (3) | create, list, revoke | `fast_saas_create_api_key` |
| Usage (2) | get_usage, get_usage_events | `fast_saas_get_usage` |
| Plan (2) | list_plans, check_feature | `fast_saas_check_feature` |
| System (3) | health, platform_stats, list_modules | `fast_saas_health` |
| Convenience (6) | overview, suspend, reactivate, limits, usage_check, rotate_key | `fast_saas_get_tenant_overview` |
| Ollama (5) | list_models, pull, generate, chat, delete | `fast_saas_ollama_chat` |
| Langflow (4) | list_flows, get_flow, run_flow, list_components | `fast_saas_langflow_run_flow` |
| Claude Agent (3) | run, get_job, list_jobs | `fast_saas_claude_run` |
| AI System (2) | ai_health, langfuse_health | `fast_saas_ai_health` |

## AI Layer

The `ai` profile adds 5 services for next-gen AI capabilities:

| Service | Subdomain | What it does |
|---|---|---|
| **LibreChat** | `chat.DOMAIN` | Multi-model chat (ChatGPT alternative) with Ollama integration |
| **Langflow** | `flow.DOMAIN` | Visual drag-and-drop LLM workflow builder |
| **Ollama** | `models.DOMAIN` | Run Llama, Mistral, Gemma, CodeLlama locally |
| **Claude Agent** | `agent.DOMAIN` | Containerized Claude Code runner with HTTP API |
| **Langfuse** | `observe.DOMAIN` | LLM call tracing, evaluations, prompt management, cost tracking |

```bash
# Enable AI layer
COMPOSE_PROFILES=essential,core,ops,ai docker compose up -d

# Pull a model
docker compose exec ollama ollama pull llama3.2

# Chat via LibreChat at https://chat.DOMAIN
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
fast-saas catalog         # List all 22 modules across 5 profiles
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
| **Configure** | "set up billing plans" | Programs services via MCP servers |
| **Convert** | "turn this into a SaaS" | Wraps oss-to-saas with pre-wired services |
| **Deploy** | "deploy to production" | Wraps deploy-to-coolify with pre-flight checks |
| **Diagnose** | "why is auth down?" | Health checks, log analysis, troubleshooting |

## SMTP Configuration

All services share a provider-agnostic SMTP config:

```bash
# Default: Stalwart (internal mail server)
SMTP_HOST=stalwart
SMTP_PORT=25

# Or switch to any external provider:
# SendGrid:  SMTP_HOST=smtp.sendgrid.net  SMTP_PORT=587
# Mailgun:   SMTP_HOST=smtp.mailgun.org   SMTP_PORT=587
# AWS SES:   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
```

## Project Structure

```
packages/
  api/                  # REST API server (38 endpoints, Express.js)
  cli/                  # @autonomyx/fast-saas CLI (TypeScript)
  mcp/                  # MCP server (44 tools)
  starter/              # Docker Compose reference stack
    docker-compose.yml  # 25 services with profiles
    Caddyfile           # Reverse proxy (19 subdomain routes)
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
| Full (+ growth) | 4 | 8 GB | 40 GB | ~$24-48 |
| Full + AI (no GPU) | 6 | 16 GB | 60 GB | ~$48-96 |
| Full + AI (GPU) | 6 | 16 GB + VRAM | 60 GB | ~$96-200 |

## Cloud Integration Placeholders

These connect via API keys (no self-hosted containers):

| Service | Env Var | Purpose |
|---|---|---|
| SignOz | `SIGNOZ_ACCESS_TOKEN` | APM + distributed tracing |
| Infisical | `INFISICAL_TOKEN` | Centralized secret management |
| PostHog Cloud | `POSTHOG_API_KEY` | Cloud-hosted product analytics |

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

## Case Studies

In-depth writeups on how the toolkit was designed and built. Each
piece is grounded in actual commits and verifiable numbers.

- [**Building the Fast SaaS Toolkit**](case-studies/building-the-fast-saas-toolkit.md) — full story of how a 22-module enterprise SaaS launchpad came together in 25 commits (~3,900 words)
- [**Carbon Dashboard Rebrand**](case-studies/blog/carbon-dashboard-rebrand.md) — how the dashboard was rebranded to IBM Carbon Design System in 3 commits with First Load JS under 102 KB (~3,000 words)

Each case study has a paired `.wp.html` file in WordPress Gutenberg
format for easy publishing. See [case-studies/README.md](case-studies/README.md)
for the full index and writing guidelines.

## Sponsor

If this toolkit saves you time, consider sponsoring its development. Your support helps maintain 22 modules, keep dependencies updated, and build new features.

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor_on_GitHub-%E2%9D%A4-pink?style=for-the-badge&logo=github)](https://github.com/sponsors/openautonomyx)

**What sponsorship funds:**
- Ongoing maintenance of 22 open-source service integrations
- New module development (vector DBs, payment gateways, CRM integrations)
- Security updates and Docker image pinning
- Documentation, tutorials, and video guides
- Community support and issue triage

**Sponsor tiers:**

| Tier | Amount | Perks |
|---|---|---|
| Backer | $5/mo | Name in README sponsors section |
| Supporter | $25/mo | Priority issue response + logo in README |
| Gold | $100/mo | 1 hour/month consulting + feature request priority |
| Platinum | $500/mo | Dedicated support channel + custom module development |

[Become a sponsor](https://github.com/sponsors/openautonomyx)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
