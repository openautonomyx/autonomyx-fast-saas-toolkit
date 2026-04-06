# Autonomyx Fast SaaS Toolkit

Launch an enterprise SaaS product in minutes, not months. Pre-wired Docker Compose stack with 17 open-source tools covering auth, billing, monitoring, analytics, email, admin, and workflow automation.

## What's Included

### Essential (always on)
- **PostgreSQL 16** — Primary database
- **Redis 7** — Cache, sessions, rate limiting
- **Caddy** — Reverse proxy with automatic HTTPS

### Core (default on)
- **Logto** — Authentication, SSO, RBAC, multi-tenant organizations
- **Lago** — Usage-based billing and subscriptions
- **RustFS** — S3-compatible object storage

### Ops (default on)
- **GlitchTip** — Error tracking (Sentry-compatible)
- **Uptime Kuma** — Uptime monitoring and status pages
- **Grafana + Prometheus + Loki** — Metrics, dashboards, log aggregation

### Growth (opt-in)
- **Matomo** — Web analytics (GDPR-compliant)
- **PostHog** — Product analytics and feature flags
- **Mautic** — Email marketing automation
- **Stalwart** — Full SMTP/IMAP mail server
- **NocoDB** — Admin dashboard (spreadsheet over databases)
- **n8n** — Workflow automation
- **Appsmith** — Low-code internal tools
- **Docmost** — Knowledge base and documentation

## Quick Start

```bash
# Clone
git clone https://github.com/openautonomyx/autonomyx-fast-saas-toolkit.git
cd autonomyx-fast-saas-toolkit/packages/starter

# Configure
cp .env.example .env
# Edit .env with your domain and secrets

# Setup databases
make setup

# Start core + ops
make up

# Check health
make health
```

## Architecture

```
Internet → Caddy (:80/:443, auto-HTTPS)
  auth.DOMAIN       → Logto
  billing.DOMAIN    → Lago
  monitor.DOMAIN    → Grafana
  errors.DOMAIN     → GlitchTip
  status.DOMAIN     → Uptime Kuma
  analytics.DOMAIN  → Matomo
  email.DOMAIN      → Mautic
  admin.DOMAIN      → NocoDB
  auto.DOMAIN       → n8n
  storage.DOMAIN    → RustFS
  docs.DOMAIN       → Docmost
  app.DOMAIN        → Your Application

Internal: PostgreSQL, Redis (shared bridge network)
```

## Multi-Tenancy Middleware

The `@autonomyx/saas-middleware` package provides:

- **Tenant Context** — Resolves tenant from JWT, loads plan and settings
- **Auth Guard** — Validates Logto JWTs and API keys
- **Rate Limiter** — Sliding-window per-tenant rate limiting via Redis
- **Usage Tracker** — Buffers API usage events, forwards to Lago for billing
- **Feature Flags** — Plan-based feature gating (free/starter/pro/enterprise)
- **Health Check** — PostgreSQL + Redis connectivity check

## Pre-Built Automation

### n8n Workflows
- **Welcome Email** — Sends onboarding email on tenant signup
- **Usage Alert** — Hourly check for tenants approaching limits
- **Error Alert** — GlitchTip webhook forwarding for critical errors

### Grafana Dashboards
- **SaaS Overview** — Active tenants, API request rates, error rates, service health

## Project Structure

```
packages/
  cli/                  # @autonomyx/fast-saas CLI (coming soon)
  starter/              # Docker Compose reference stack
    docker-compose.yml  # All 17 services with profiles
    Caddyfile           # Reverse proxy routes
    .env.example        # All configuration variables
    Makefile            # Lifecycle commands
    middleware/          # @autonomyx/saas-middleware (TypeScript)
    migrations/          # PostgreSQL schema (5 files)
    scripts/             # setup, seed, backup, health-check
    n8n-workflows/       # Pre-built automation (3 workflows)
    grafana-dashboards/  # Pre-built dashboards
    services/            # Per-service configuration
  skill/                # Claude Code skill (coming soon)
docs/                   # Documentation (coming soon)
```

## Resource Requirements

| Profile | vCPU | RAM | Disk | Est. Cost/mo |
|---|---|---|---|---|
| Minimal (essential + core) | 2 | 4 GB | 20 GB | ~$12-24 |
| Standard (+ ops) | 3 | 6 GB | 30 GB | ~$18-36 |
| Full (+ all growth) | 4 | 8 GB | 40 GB | ~$24-48 |

## License

MIT
