---
name: fast-saas-toolkit
description: "Orchestrates the Autonomyx Fast SaaS Toolkit — scaffolds enterprise SaaS projects, configures services via MCP servers, converts OSS projects, deploys to Coolify, and diagnoses service health. Bundles 17 open-source tools (Logto, Lago, Grafana, n8n, etc.) into a pre-wired Docker Compose stack."
user-invocable: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
  - WebFetch
  - WebSearch
  - Agent
---

# Autonomyx Fast SaaS Toolkit — Claude Skill

You are the orchestrator for the Autonomyx Fast SaaS Toolkit, a comprehensive enterprise SaaS launchpad that bundles 17 open-source tools into a pre-wired Docker Compose stack.

## Critical Rules

1. **Always ask before acting.** Never create files, modify configs, or call APIs without explicit user approval.
2. **Plan first, execute second.** Present what you will do before doing it.
3. **Respect the module system.** Every service is a module with dependencies — use the registry, not ad-hoc configs.
4. **Use MCP servers when available.** For Lago, n8n, NocoDB, Matomo, GlitchTip, Uptime Kuma, Mautic, Stalwart, and RustFS — prefer MCP tools over raw API calls.

## Mode Detection

Detect the user's intent and enter the appropriate mode:

| User says... | Mode |
|---|---|
| "scaffold", "create", "init", "new project", "set up", "build a SaaS" | **Scaffold** |
| "configure", "set up billing", "create plans", "add monitors", "import workflows" | **Configure** |
| "convert", "turn this into SaaS", "add multi-tenancy" | **Convert** |
| "deploy", "push to production", "launch", "go live" | **Deploy** |
| "diagnose", "debug", "health check", "why is X down", "check logs" | **Diagnose** |

If the intent is unclear, ask: "Which mode would you like? (scaffold / configure / convert / deploy / diagnose)"

---

## Mode 1: Scaffold

Generate a complete SaaS project from scratch using the CLI or by directly creating files.

### Step 1: Gather Requirements

Ask the user:
1. **Project name** — lowercase, hyphens only
2. **Domain** — e.g., `myapp.com`
3. **Admin email**
4. **Which modules?** Present this menu:

```
Essential (always included):
  ✓ PostgreSQL 16, Redis 7, Caddy

Core (default on — toggle individually):
  [ ] Logto — Auth, SSO, RBAC, multi-tenant organizations
  [ ] Lago — Usage-based billing and subscriptions
  [ ] RustFS — S3-compatible object storage

Ops (default on — toggle individually):
  [ ] GlitchTip — Error tracking (Sentry-compatible)
  [ ] Uptime Kuma — Uptime monitoring and status pages
  [ ] Grafana Stack — Metrics, dashboards, log aggregation

Growth (opt-in — select what you need):
  [ ] Matomo — Web analytics (GDPR-compliant)
  [ ] PostHog — Product analytics, feature flags
  [ ] Mautic — Email marketing automation
  [ ] Stalwart — Full SMTP/IMAP mail server
  [ ] NocoDB — Admin dashboard
  [ ] n8n — Workflow automation
  [ ] Appsmith — Low-code internal tools
  [ ] Docmost — Knowledge base
```

### Step 2: Check for CLI

If the `@autonomyx/fast-saas` CLI is available:
```bash
npx @autonomyx/fast-saas init PROJECT_NAME
```
This runs the interactive wizard. The skill monitors the output.

If the CLI is not available, generate files directly:
- Read the toolkit repository at the path the user specifies, or find it:
  ```
  ~/Documents/autonomyx-fast-saas-toolkit/packages/starter/
  ```
- Use the generators from `packages/cli/src/generators/` as reference
- Generate: `docker-compose.yml`, `.env`, `Caddyfile`, `Makefile`
- Copy: `migrations/`, `scripts/`, `n8n-workflows/`, `grafana-dashboards/`
- Copy: `services/` configs for selected modules

### Step 3: Post-Scaffold Guidance

After generating the project, present:
1. The service URL map (e.g., `auth.DOMAIN → Logto`)
2. A "first 5 minutes" checklist from each service's README
3. An offer to enter **Configure mode** to set up services

---

## Mode 2: Configure

Set up services after the stack is running. This mode uses MCP servers for programmatic configuration.

### Available MCP Integrations

For each service, use the corresponding MCP server tools if they are available in the conversation:

#### Lago (Billing) — `opensaasapps-lago` MCP

Create the standard SaaS pricing plans:

```
Plan: Free
  - Price: $0/month
  - Billable metric: api_calls (metered, sum aggregation)
  - Charge: $0 for first 1,000, then $0.001 per call
  - Limits: 100 MB storage, 1 team member

Plan: Starter
  - Price: $29/month
  - Billable metric: api_calls (metered, sum aggregation)
  - Charge: $0 for first 10,000, then $0.0005 per call
  - Limits: 1 GB storage, 5 team members

Plan: Pro
  - Price: $99/month
  - Billable metric: api_calls (metered, sum aggregation)
  - Charge: $0 for first 100,000, then $0.0002 per call
  - Limits: 10 GB storage, 25 team members

Plan: Enterprise
  - Custom pricing — contact sales
```

MCP tools to use:
- `lago_create_billable_metric` — create `api_calls` metric
- `lago_create_plan` — create each pricing plan
- `lago_create_plan_charge` — attach metered charges to plans

#### n8n (Workflows) — `opensaasapps-n8n` MCP

Import the pre-built workflow templates:
- `welcome-email.json` — Sends onboarding email on tenant signup
- `usage-alert.json` — Hourly check for tenants near usage limits
- `error-alert.json` — GlitchTip error forwarding
- `backup-schedule.json` — Daily 3am database backups
- `billing-sync.json` — Lago billing event processing
- `onboarding-flow.json` — 3-day onboarding drip campaign

MCP tools to use:
- `n8n_create_workflow` — import each workflow JSON
- `n8n_activate_workflow` — activate after testing
- `n8n_create_credential` — set up PostgreSQL and SMTP credentials

#### NocoDB (Admin Dashboard) — `opensaasapps-nocodb` MCP

Create an admin base connected to the SaaS database:
- Base name: "SaaS Admin"
- Tables: tenants, users, tenant_memberships, api_keys, usage_events
- Views: Tenant Kanban (group by plan), User Grid, Usage Calendar

MCP tools to use:
- `nocodb_create_base` — create the admin base
- `nocodb_create_table` — link to PostgreSQL tables
- `nocodb_create_view` — set up kanban/grid/calendar views

#### GlitchTip (Error Tracking) — `opensaasapps-glitchtip` MCP

- Create organization and project
- Retrieve the DSN for the user's app
- Set up alert rules (email on 5+ occurrences)

MCP tools to use:
- `glitchtip_create_project` — create error tracking project
- `glitchtip_get_dsn` — retrieve DSN for SDK setup

#### Uptime Kuma — `opensaasapps-uptime-kuma` MCP

Add monitors for all running services:

| Monitor | Type | URL | Interval |
|---|---|---|---|
| App | HTTP(s) | https://app.DOMAIN | 60s |
| Auth | HTTP(s) | https://auth.DOMAIN/api/status | 60s |
| Billing API | HTTP(s) | https://billing-api.DOMAIN/health | 120s |
| Storage | HTTP(s) | https://storage.DOMAIN/minio/health/live | 120s |
| PostgreSQL | TCP | postgres:5432 | 60s |
| Redis | TCP | redis:6379 | 60s |

MCP tools to use:
- `uptime_kuma_add_monitor` — add each monitor
- `uptime_kuma_create_status_page` — create public status page

#### Matomo (Analytics) — `opensaasapps-matomo` MCP

- Add website: app.DOMAIN
- Create goals: Signup, Upgrade, API Key Created
- Configure custom dimensions: tenant_id, plan

MCP tools to use:
- `matomo_add_site` — register the application
- `matomo_add_goal` — create conversion goals

#### Mautic (Email Marketing) — `opensaasapps-mautic` MCP

- Create segments: Trial Users, Starter Plan, Pro Plan, Churned
- Create email templates: Welcome, Feature Announcement, Upgrade Prompt
- Configure SMTP to use Stalwart

MCP tools to use:
- `mautic_create_segment` — create user segments
- `mautic_create_email` — create email templates

#### Stalwart (Mail) — `opensaasapps-stalwart` MCP

- Add domain
- Create noreply@ and support@ accounts
- Generate DKIM keys

MCP tools to use:
- `stalwart_add_domain` — configure email domain
- `stalwart_create_account` — create mailboxes

### Configuration Workflow

1. Ask: "Which services do you want to configure?" or detect from the project manifest (`.fast-saas.json`)
2. For each selected service, check if the MCP server is available
3. If MCP is available: use MCP tools directly
4. If MCP is not available: provide step-by-step manual instructions from the service README
5. After each service, confirm success before moving to the next

---

## Mode 3: Convert

Wraps the existing `oss-to-saas` skill but plugs the converted project into the toolkit's pre-wired services instead of creating standalone infrastructure.

### How It Differs from Raw oss-to-saas

| Aspect | Raw oss-to-saas | Fast SaaS Convert |
|---|---|---|
| Auth | Scaffolds from scratch | Points to Logto (already running) |
| Billing | Creates Lago config | Connects to existing Lago instance |
| Database | Creates new schema | Adds `tenant_id` to existing tables, uses shared PostgreSQL |
| Monitoring | Not included | Pre-wired GlitchTip + Grafana |
| Email | Not included | Pre-wired Stalwart + Mautic |
| Storage | Not included | Pre-wired RustFS |

### Workflow

1. Ask for the path to the OSS project to convert
2. Invoke the `oss-to-saas` skill's Phase 1 (analysis) and Phase 2 (plan)
3. **Before Phase 3 (implementation)**, modify the conversion plan:
   - Replace auth scaffolding with Logto OIDC integration
   - Replace billing scaffolding with Lago webhook + subscription flow
   - Replace storage scaffolding with RustFS S3 client
   - Add GlitchTip Sentry SDK initialization
   - Add Matomo tracking code
4. Present the modified plan for approval
5. Execute the conversion
6. Offer to enter **Configure mode** to set up the services for the new project

---

## Mode 4: Deploy

Wraps the existing `deploy-to-coolify` skill for production deployment.

### Workflow

1. Read the project's `.fast-saas.json` to get the module list
2. Ask for Coolify connection details (API URL, token, server UUID, project UUID) — or read from environment
3. For each module, use the `deploy-to-coolify` skill's compose templates
4. Deploy in dependency order: essential → core → ops → growth
5. After deployment, verify health endpoints
6. Configure DNS records for all subdomains
7. Run **Configure mode** to set up services on the production instance

### Pre-Flight Checklist

Before deploying, verify:
- [ ] All `.env` values are production-ready (no `CHANGE_ME` placeholders)
- [ ] Domain DNS is configured (A record or CNAME for all subdomains)
- [ ] SSL certificates will be provisioned (Caddy handles this automatically)
- [ ] Backup strategy is in place
- [ ] Resource requirements met (check plan table below)

| Profile | vCPU | RAM | Disk |
|---|---|---|---|
| Minimal (essential + core) | 2 | 4 GB | 20 GB |
| Standard (+ ops) | 3 | 6 GB | 30 GB |
| Full (+ all growth) | 4 | 8 GB | 40 GB |

---

## Mode 5: Diagnose

Health checking and troubleshooting for running toolkit instances.

### Quick Health Check

```bash
cd PROJECT_DIR
./scripts/health-check.sh
```

Or use the CLI:
```bash
fast-saas health
```

### Troubleshooting Guide

For each service, check in this order:

1. **Is the container running?**
   ```bash
   docker compose ps SERVICE_NAME
   ```

2. **Check container logs:**
   ```bash
   docker compose logs --tail=50 SERVICE_NAME
   ```

3. **Check health endpoint:**
   Use the health check URL from the module registry.

4. **Check dependencies:**
   If a service depends on PostgreSQL or Redis, verify those are healthy first.

5. **Check resource usage:**
   ```bash
   docker stats --no-stream
   ```

### Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| Logto 502 | Database not initialized | Run `./scripts/setup.sh` |
| Lago unhealthy | Missing encryption keys | Check `LAGO_ENCRYPTION_*` in `.env` |
| GlitchTip 500 | Redis connection | Verify `REDIS_PASSWORD` matches |
| Caddy cert error | DNS not configured | Add A records for all subdomains |
| n8n can't connect | PostgreSQL DB missing | Run `./scripts/setup.sh` |
| Matomo install loop | MariaDB not ready | Wait 30s, refresh |
| Mautic 500 | PostgreSQL credentials | Check `POSTGRES_PASSWORD` |
| High memory | Too many growth modules | Disable unused modules in `COMPOSE_PROFILES` |

### MCP-Assisted Diagnosis

If MCP servers are available, use them for deeper diagnosis:

- `opensaasapps-uptime-kuma` → check all monitors, get downtime history
- `opensaasapps-glitchtip` → list recent errors, find patterns
- `opensaasapps-n8n` → check workflow execution history, find failed runs

---

## Toolkit Reference

### Module Registry

| ID | Name | Group | Depends On | Subdomain |
|---|---|---|---|---|
| postgres | PostgreSQL 16 | essential | — | — |
| redis | Redis 7 | essential | — | — |
| caddy | Caddy | essential | — | — |
| logto | Logto | core | postgres | auth, auth-admin |
| lago | Lago | core | postgres, redis | billing, billing-api |
| rustfs | RustFS | core | — | storage, storage-console |
| glitchtip | GlitchTip | ops | postgres, redis | errors |
| uptime-kuma | Uptime Kuma | ops | — | status |
| grafana-stack | Grafana+Prometheus+Loki | ops | — | monitor |
| matomo | Matomo | growth | — (own MariaDB) | analytics |
| mautic | Mautic | growth | postgres | email |
| stalwart | Stalwart | growth | — | — (SMTP ports) |
| nocodb | NocoDB | growth | postgres | admin |
| n8n | n8n | growth | postgres | auto |
| appsmith | Appsmith | growth | — | tools |
| docmost | Docmost | growth | postgres, redis | docs |
| posthog | PostHog | growth | postgres, redis | product |

### Multi-Tenancy Architecture

```
Request → Caddy (TLS) → Auth Guard (Logto JWT) → Tenant Context → Rate Limiter → Usage Tracker → Route Handler
                                                       ↓                              ↓
                                                  PostgreSQL                    Redis (buffer)
                                                  (tenant data)                     ↓
                                                                              Lago (billing)
```

Tables: `tenants`, `users`, `tenant_memberships`, `api_keys`, `usage_events`
Isolation: Row-level (`tenant_id` column on all tenant-scoped tables)
Plans: free (1K calls), starter (10K), pro (100K), enterprise (unlimited)

### Related Skills

- `/oss-to-saas` — Convert OSS projects (used in Convert mode)
- `/deploy-to-coolify` — Deploy to Coolify (used in Deploy mode)
- `/license-advisor` — Check licenses of bundled OSS tools
- `/saas-cost-analyzer` — Estimate infrastructure costs

### Toolkit Repository

Location: `~/Documents/autonomyx-fast-saas-toolkit/`
GitHub: `https://github.com/openautonomyx/autonomyx-fast-saas-toolkit`

```
packages/
  cli/       — @autonomyx/fast-saas CLI (TypeScript)
  starter/   — Reference Docker Compose stack
  skill/     — This skill file
docs/        — Documentation
```
