# Building the Autonomyx Fast SaaS Toolkit

**A case study in how a single developer shipped a 22-module enterprise SaaS launchpad in ~25 commits**

- Repository: [openautonomyx/autonomyx-fast-saas-toolkit](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit)
- Published: v0.2.0 on npm (`@autonomyx/fast-saas`, `@autonomyx/saas-middleware`)
- License: MIT

---

## The Problem

Every founding engineer starting a SaaS product hits the same wall: before you can write a single line of product code, you need auth, billing, storage, monitoring, error tracking, analytics, email, and a half-dozen other things that have nothing to do with your actual idea. The usual options are all bad:

- **Vendor lock-in by default** — Stitch together Stripe + Auth0 + Segment + Mixpanel + Sentry + SendGrid. You're paying $500/month before your first user signs up, and you can't walk away without a multi-week migration.
- **Roll your own** — Spend 2-3 months writing auth, tenant isolation, rate limiting, usage tracking, and billing integration. None of it is your product, but all of it blocks your product.
- **Use a "SaaS in a box" framework** — Accept whatever opinions the framework has baked in, hope they match your needs, rewrite half of it when they don't.

The Autonomyx Fast SaaS Toolkit takes a fourth path: **bundle 22 battle-tested open-source tools into a pre-wired Docker Compose stack**, then add a thin TypeScript middleware layer that makes them feel like one product. Pay zero vendor subscriptions, own your data, skip the months of plumbing, and keep the option to replace any single piece later without a rewrite.

This case study documents how that toolkit came together — the architecture decisions, the trade-offs, the numbers, and the commit history. Everything here is verifiable against the repo.

---

## The Numbers

From `git log` and `find | wc -l` on the main branch:

| Metric | Value |
|---|---|
| Commits on `main` | 25 |
| Total lines (code + docs + config) | ~10,700 |
| TypeScript/TSX lines across 5 packages | ~5,400 |
| Docker services defined in compose | 60 service blocks (25 runtime containers across 5 profile groups) |
| Caddy reverse proxy routes | 22 subdomains |
| SQL migrations | 5 |
| n8n automation workflows (pre-built) | 6 |
| Grafana dashboards (pre-built) | 4 |
| Prometheus alert rules | 10 |
| Documentation files | 15 |
| Published npm packages | 2 (`@autonomyx/fast-saas`, `@autonomyx/saas-middleware`) |
| GitHub releases | 3 (v0.1.0, v0.1.1, v0.2.0) |

The TypeScript breakdown by package:

| Package | Lines | Purpose |
|---|---|---|
| `packages/cli` | 2,167 | CLI scaffolding tool with 9 commands, 22-module registry, 3 generators |
| `packages/api` | 970 | Express REST API with 38 endpoints across 9 routers |
| `packages/mcp` | 840 | Model Context Protocol server exposing 44 tools to Claude |
| `packages/dashboard` | 835 | Next.js 15 command center with Carbon Design System |
| `packages/starter/middleware` | 552 | Multi-tenancy middleware (auth, rate limit, usage, feature flags) |

Roughly 5,400 lines of TypeScript for a system that orchestrates 22 services, exposes 38 HTTP endpoints, publishes 2 npm packages, and ships a full Next.js dashboard. The leanness comes from **not building what already exists** — each service is an upstream OSS project, and the middleware glues them together rather than reimplementing them.

---

## Architecture: The 5-Layer Model

The toolkit organizes everything into five Docker Compose profile groups. Each layer is independently deployable — teams can start with Essential+Core and add Ops, Growth, or AI as they grow.

### Layer 1: Essential (always on)

The three services every SaaS product needs regardless of stack:

- **PostgreSQL 16** — shared database for almost everything
- **Redis 7** — cache, session store, rate limit window, usage tracker buffer
- **Caddy** — reverse proxy with automatic HTTPS via Let's Encrypt

Three services, three containers, zero vendor accounts. Caddy's automatic HTTPS is the unsung hero here: add a subdomain to the Caddyfile, and Caddy provisions a certificate from Let's Encrypt without any human intervention. No cert renewal cron jobs, no nginx config hell.

### Layer 2: Core (default on)

The four services that define "this is a SaaS product":

- **Logto** — authentication, SSO, RBAC, multi-tenant organizations
- **Lago** — usage-based billing and subscription management
- **RustFS** — S3-compatible object storage (MinIO fork in Rust, lighter on memory)
- **SaaS API** (custom) — Express.js REST API exposing 38 endpoints

The SaaS API is the only custom service in the Core layer — everything else is upstream OSS. The API's job is to expose a coherent HTTP interface over the toolkit's data model (tenants, users, memberships, API keys, usage events) and to proxy AI service operations. It uses the multi-tenancy middleware internally.

**Decision:** Build the API with raw Express + `pg` + `ioredis`, no ORM. The data model is simple (5 tables) and SQL is more auditable than ORM-generated queries. At 970 lines, the whole API is one afternoon of reading.

### Layer 3: Ops (default on)

Everything needed to keep the system healthy without babysitting:

- **GlitchTip** — Sentry-compatible error tracking (same SDK, OSS license)
- **Uptime Kuma** — uptime monitoring and public status page
- **Grafana + Prometheus + Loki** — metrics, dashboards, log aggregation

Four Grafana dashboards ship pre-provisioned: SaaS Overview, Tenant Usage, Infrastructure, Billing. Ten Prometheus alert rules cover the basics (ServiceDown, HighErrorRate, HighLatency, HighCPU, HighMemory, DiskSpaceLow, PostgresConnectionsHigh, RedisMemoryHigh, TenantOverLimit, BillingWebhookFailure).

**Decision:** Ship dashboards as JSON, not as a Helm chart or a "run this import script" step. Grafana's file-based provisioning picks them up on startup. Zero-click configuration.

### Layer 4: Growth (opt-in)

Eight services that matter once you have users but don't matter before you do:

- **Matomo** — GDPR-compliant web analytics (self-hosted Google Analytics replacement)
- **PostHog** — product analytics, feature flags, session replay
- **Mautic** — email marketing automation
- **Stalwart** — full SMTP/IMAP mail server for transactional email
- **NocoDB** — admin dashboard (spreadsheet-over-PostgreSQL)
- **n8n** — workflow automation, like Zapier but self-hosted
- **Appsmith** — low-code internal tool builder
- **Docmost** — knowledge base and documentation

Six n8n workflows ship pre-built: welcome email, usage alert, error alert, daily backup, billing sync, and a 3-day onboarding drip campaign. Each is a single JSON file that n8n imports on first run.

**Decision:** Keep Growth opt-in via Docker Compose profiles. A new SaaS doesn't need Matomo on day one. `COMPOSE_PROFILES=essential,core,ops` brings up the minimum; `COMPOSE_PROFILES=essential,core,ops,growth` adds everything. Same compose file, different startup command.

### Layer 5: AI (opt-in)

The next-gen layer, added after the initial 4-layer stack was working:

- **LibreChat** — multi-model AI chat with MongoDB + Meilisearch sidecars
- **Langflow** — visual LLM workflow builder
- **Ollama** — local LLM runtime (Llama, Mistral, Gemma, CodeLlama)
- **Claude Agent** — containerized Claude Code runner with async HTTP API
- **Langfuse** — LLM observability, tracing, and cost tracking

**Decision:** LibreChat needs MongoDB (not PostgreSQL), so it gets a sidecar container. This broke the "everything uses shared Postgres" rule, but LibreChat is the only exception and the alternative (fork LibreChat to use Postgres) is much more work than accepting one extra container.

**Decision:** The Claude Agent Runner is a thin Express wrapper around the `claude` CLI that exposes `POST /run` → async job → `GET /jobs/:id`. Any service can trigger a Claude Code session via HTTP. This turns Claude Code from a developer tool into **an operator** — n8n workflows can ask it to modify code on demand.

---

## The Three Interfaces

Once the 22 services are running, users need ways to interact with them. The toolkit ships three:

### 1. CLI — `@autonomyx/fast-saas`

A 2,167-line TypeScript CLI built with Commander.js + `@inquirer/prompts`. Nine commands:

| Command | Purpose |
|---|---|
| `fast-saas init [name]` | Interactive project scaffold — pick modules, generate compose/env/caddy |
| `fast-saas catalog` | List all 22 modules across 5 profile groups |
| `fast-saas add <module>` | Add a module to an existing project, auto-resolves dependencies |
| `fast-saas remove <module>` | Remove a module, checks for dependents |
| `fast-saas up [--detach]` | Start services |
| `fast-saas down` | Stop services |
| `fast-saas health` | Status table for all running services |
| `fast-saas env [--regen]` | Validate or regenerate `.env` secrets |
| `fast-saas deploy` | Deploy to Coolify (optional) |

The CLI's `ModuleDefinition` interface is the heart of the system. Every service is a single object with its Docker image, ports, env vars, dependencies, health check, Caddy routes, and optional sidecars. Three generators (`compose.ts`, `caddy.ts`, `env.ts`) read the registry and produce the actual config files.

**Decision:** Use a registry pattern instead of Handlebars templates. Templates seemed cleaner at first, but the generators needed too much conditional logic (does this service use the shared PG? does it have a sidecar? does it need a specific env var format?). TypeScript switch statements with typed `ModuleDefinition` objects are easier to audit and harder to break than nested Handlebars helpers.

### 2. REST API — `@autonomyx/api`

A 970-line Express server exposing **38 endpoints across 9 routers**:

| Router | Endpoints | Purpose |
|---|---|---|
| `/health` | 1 | PostgreSQL + Redis liveness |
| `/api/v1/plans` | 2 | Plan definitions + feature checks |
| `/api/v1/tenants` | 6 | Full CRUD + plan changes |
| `/api/v1/users` | 4 | User CRUD |
| `/api/v1/tenants/:id/members` | 4 | Team membership management |
| `/api/v1/tenants/:id/api-keys` | 3 | API key creation/revocation (bcrypt-hashed) |
| `/api/v1/tenants/:id/usage` | 2 | Usage summary and raw events |
| `/api/v1/admin` | 2 | Platform stats and module list |
| `/api/v1/ai` | 14 | Ollama, Langflow, Claude Agent, Langfuse proxies |

Auth is dual-mode: Logto JWTs for user-facing operations, platform API keys (`pk_` prefix) for admin access. The AI routes proxy to internal Docker services — no extra credentials needed since all traffic is inside the `saas-internal` Docker bridge network.

**Decision:** Handle all AI service operations through the SaaS API rather than exposing each AI service's admin interface directly. This gives a single auth boundary, single rate limit, and single usage tracking path for all operations. The user's Claude skill only needs to know about one API.

### 3. Dashboard — Next.js 15 + IBM Carbon Design System

The most opinionated piece of the toolkit: a Next.js 15 command center with Server Components, IBM Carbon Design System tokens, and hand-built primitives.

The dashboard went through a late rebrand. The first version used a dark theme with Fraunces + DM Sans fonts and purple/green accents. It looked fine but felt like "another startup dashboard." The rebrand replaces it with IBM's Carbon Design System v11 — sharp corners, Gray 100 ramp, Blue 60 primary, IBM Plex Sans + IBM Plex Mono fonts. The same visual language IBM uses for Cloud, Watson, and Think.

**The critical decision was whether to use `@carbon/react` or hand-build the primitives.** `@carbon/react` would give 60+ components for free but add ~500 KB to the bundle. The toolkit needed 6 components (Shell, Button, TextInput, Modal, DataTable, StatTile). Hand-building them against the Carbon spec took ~480 lines and kept the First Load JS at **102 KB** — about the same as the pre-rebrand version.

Carbon tokens are declared in `globals.css` using Tailwind v4's `@theme` directive, which exposes them as both Tailwind utility classes and raw CSS custom properties. The whole design system is one CSS file plus six component files.

The dashboard layout follows Carbon's UI Shell pattern exactly: 48-pixel black header with the Autonomyx wordmark, 256-pixel white side nav with seven menu items (three active, four placeholders for future pages), light gray content area. The overview page shows a 4-up stats grid (Tenants / Users / API Calls / Services Up) and a Carbon DataTable with all 22 services grouped by layer.

Build output: **3-second compile, 102 KB First Load JS, 4 static pages generated cleanly**. For a system with a full design system, admin shell, and Server Component data fetching, that's lean.

---

## Multi-Tenancy Middleware: The Unseen Hero

The 552-line `@autonomyx/saas-middleware` package is the piece that makes the whole toolkit feel like one product. Six modules, each ~100 lines:

| Module | What it does |
|---|---|
| `auth-guard.ts` | Validates Logto JWTs via JWKS, supports `sk_`-prefixed API keys |
| `tenant-context.ts` | Resolves tenant from JWT claims, loads plan and settings from DB |
| `rate-limiter.ts` | Per-tenant sliding-window via Redis sorted sets |
| `usage-tracker.ts` | Buffers API events in Redis, flushes to PostgreSQL + Lago |
| `feature-flags.ts` | Plan-based gating (free/starter/pro/enterprise) |
| `health.ts` | PostgreSQL + Redis health check endpoint |

Every request to the SaaS API flows through this chain: auth → tenant context → rate limiter → usage tracker → route handler. The usage tracker is particularly interesting — it buffers events in Redis via `RPUSH` (O(1), non-blocking), then a background worker flushes batches of 500 events to PostgreSQL and forwards them to Lago every 30 seconds. This gives per-tenant billing without adding latency to hot-path requests.

**Decision:** Row-level tenant isolation via a `tenant_id` column on every tenant-scoped table. Schema-per-tenant would be more secure but dramatically more expensive at scale and harder to migrate. Row-level covers 90% of SaaS use cases and costs essentially nothing.

---

## The MCP Server: Making Claude an Operator

The `@autonomyx/mcp-fast-saas` package exposes **44 Model Context Protocol tools** to Claude Code:

| Tool group | Count | Examples |
|---|---|---|
| Tenant management | 6 | create_tenant, list_tenants, change_plan |
| User management | 4 | create_user, get_user, update_user |
| Member management | 4 | add_member, remove_member, update_member |
| API key management | 3 | create_api_key, revoke_api_key, rotate_api_key |
| Usage and billing | 2 | get_usage, check_usage_limit |
| Plan and features | 2 | list_plans, check_feature |
| System and admin | 3 | health, platform_stats, list_modules |
| Convenience tools | 6 | get_tenant_overview, suspend_tenant, reactivate_tenant |
| Ollama | 5 | list_models, pull_model, generate, chat, delete_model |
| Langflow | 4 | list_flows, get_flow, run_flow, list_components |
| Claude Agent | 3 | run, get_job, list_jobs |
| AI system | 2 | ai_health, langfuse_health |

Each tool is a thin wrapper that proxies to the REST API. Claude doesn't need credentials for each service — it authenticates once to the SaaS API with a platform key, and the API handles the rest.

**Decision:** Wrap the REST API instead of talking to PostgreSQL directly from the MCP server. This keeps authentication, rate limiting, and usage tracking in one place. The MCP server can run on a different machine (Claude Code's local environment) while the API runs in Docker. The downside is one extra network hop; the upside is zero drift between the API and MCP surfaces — they're always consistent by construction.

---

## Lessons Learned

### 1. The registry pattern beats templates for config generation

The CLI's first draft used Handlebars templates. It worked but every small change (add a sidecar, change an env var format, handle a special case) required touching both a `.hbs` template and a generator function. Replacing templates with TypeScript objects and switch statements halved the code and eliminated a class of bugs where template logic and generator logic drifted apart.

### 2. Profile groups beat multiple compose files

Docker Compose supports `--profile` flags that selectively enable services. The alternative — separate `docker-compose.yml`, `docker-compose.ops.yml`, `docker-compose.growth.yml` files merged with `-f` flags — seemed cleaner at first but became unmanageable. A single compose file with profile-tagged services means there's one source of truth, one env file, and one `docker compose up` command. The CLI generates the correct `COMPOSE_PROFILES` value in `.env` based on which modules the user selected.

### 3. Open SMTP config beats hardcoded mail server

An early version of the toolkit hardcoded Stalwart as the SMTP server. When users wanted to use SendGrid or Mailgun instead, they had to edit the service definitions. The fix was simple: provide `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` env vars that default to the internal Stalwart container. Change four env vars and the whole toolkit uses SendGrid instead. One commit: `feat: Add open SMTP config to AI layer services`.

### 4. The E2E test catches the bugs the code review doesn't

The first local end-to-end test of the Docker Compose stack surfaced three bugs the code review missed:
- **Logto failed to start on first run** because it needs `npx @logto/cli db seed --swe` before the server can boot. The setup script now runs the seed automatically.
- **RustFS health check returned 403** (auth required) instead of 200, which Docker interpreted as unhealthy. Fixed by accepting both 200 and 403 as "alive".
- **Logto port 3001 conflicted with Uptime Kuma**. The host ports changed from 3001/3002 to 3301/3302.

None of these bugs would have been caught by code review or unit tests. They required actually running the compose stack on a Mac with Docker Desktop. One commit bundled all three fixes: `fix: E2E test findings — Logto seed, RustFS health, port conflicts`.

### 5. Hand-build primitives for small design systems

Choosing to hand-build Carbon primitives instead of using `@carbon/react` was a surprising win. The toolkit's dashboard needs six components. `@carbon/react` provides sixty. Taking the 500 KB dependency to use 10% of its surface area is a bad trade, especially when the Carbon spec is published openly and the primitives are straightforward HTML + Tailwind. The result is a dashboard that loads in 102 KB First Load JS while matching Carbon visually.

### 6. Ship documentation as code

The toolkit ships 15 documentation files in `docs/` — quick start, architecture, CLI reference, module guides, deployment, security, troubleshooting, plus three business templates (launch checklist, pricing page, investor metrics). All are committed to the repo alongside the code. When the code changes, the docs change in the same commit. When someone reads a commit history to understand why a decision was made, the decision is in the commit message and the long-form rationale is in the corresponding doc file.

### 7. Publish early, iterate in public

The toolkit went through three releases in quick succession: v0.1.0 (initial), v0.1.1 (E2E fixes), v0.2.0 (AI layer + API + MCP + dashboard rebrand). Each release went out on npm as soon as it was working, even if some features weren't complete. npm's semver convention makes this safe — users who pin `0.1.x` don't get AI layer breaking changes until they explicitly upgrade.

---

## What's in a Commit

The full commit history reads as a story. Here's every commit on `main`, grouped by phase:

**Phase 1-2: Foundation (2 commits)**
- `191773a` Initial commit
- `40cec1e` Phase 1 foundation — Docker Compose stack with 17 OSS services

**Phase 3-6: Building up (4 commits)**
- `205d40d` Phase 2 — CLI scaffolding tool (@autonomyx/fast-saas)
- `3bbc1e0` Phase 3 — Ops + Growth module configs, dashboards, workflows, alerting
- `a50eca1` Phase 4 — Claude Code skill with 5 operating modes
- `f75450c` Phase 5 — Complete documentation suite (15 files)

**E2E validation and release prep (3 commits)**
- `969d8be` Phase 6 — CI/CD, npm publish config, README polish, type fixes
- `9eef78e` fix: E2E test findings — Logto seed, RustFS health, port conflicts
- `9bc0ad6` feat: REST API (24 endpoints) + MCP server (30 tools)

**AI layer added (4 commits)**
- `964cbbe` feat: Next-gen AI layer — LibreChat, Langflow, Ollama, Claude Agent
- `827b0c2` feat: Add Langfuse LLM observability to AI layer
- `9daf383` feat: Add open SMTP config to AI layer services
- `caa05b6` feat: AI API routes (14 endpoints) + MCP tools (14 tools)

**Documentation and release (4 commits)**
- `d48295f` docs: Complete GitHub documentation refresh
- `f77583c` docs: Add GitHub Sponsors + funding configuration
- `843d5b9` feat: Update Claude skill with AI layer, 44 MCP tools, updated module registry
- `3b0976a` chore: Bump all package versions to 0.2.0

**Production hardening (2 commits)**
- `f9c14ce` fix: Remove profiles from essential services (postgres, redis, caddy)
- `72e3f89` fix: E2E test findings — Langflow volume, profiles, ports

**Dashboard build and Carbon rebrand (5 commits)**
- `b9b323a` feat: Next.js command center dashboard
- `377a42c` chore: gitignore Next.js build artifacts and local config
- `cc34c09` feat(dashboard): adopt IBM Carbon Design System tokens and fonts
- `e3aafd5` feat(dashboard): hand-built Carbon primitives (no Carbon React dep)
- `6b36b1a` refactor(dashboard): convert overview to Carbon DataTable pattern
- `5ac774c` chore: gitignore TypeScript incremental build cache

25 commits. Every feature phase is one or two commits. Every bug fix references the symptom it fixes. Every documentation update is its own commit. Commit messages are written for the reader, not the author — someone landing on `caa05b6` can learn what the commit does and why without opening the code.

---

## What It Doesn't Do

Every case study should be honest about what's missing. The Fast SaaS Toolkit **does not**:

- **Process payments**. Lago is a billing engine, not a payment processor. It delegates card operations to Stripe, GoCardless, or Adyen. If you want Lago to charge a card, you still need a Stripe account.
- **Provide a tenant-signup UI**. The toolkit has tenant CRUD endpoints but no React signup form. Your product owns that page. The toolkit just gives you the backend to talk to.
- **Handle Kubernetes**. The whole stack is Docker Compose. Scaling beyond a single server requires migrating to K8s, which is out of scope. The toolkit is optimized for the first 1,000 tenants, not the first 1,000,000.
- **Replace your application code**. This is infrastructure. You still have to build the product that lives inside it.
- **Solve the compliance problem**. SOC 2, HIPAA, GDPR — the toolkit gives you the technical primitives (audit logs, encryption at rest, data residency controls) but the paperwork and process are still yours.

These are not bugs. They're scope decisions. Attempting any of them would have doubled the codebase and blurred the toolkit's purpose.

---

## The Numbers, Revisited

After 25 commits, two npm packages published, and one complete Carbon rebrand, the toolkit lands at:

- **22 modules** across 5 Docker Compose profile groups
- **25 runtime containers** with full health checks and dependency ordering
- **38 REST API endpoints** across 9 routers
- **44 MCP tools** exposing the API surface to Claude
- **22 Caddy reverse proxy subdomains** with automatic HTTPS
- **5 SQL migrations** defining the tenant data model
- **6 n8n workflows** shipped ready-to-import
- **4 Grafana dashboards** with 10 Prometheus alert rules
- **15 documentation files** from quick start to troubleshooting
- **5 packages** (`api`, `cli`, `mcp`, `dashboard`, `starter/middleware`)
- **~10,700 total lines** of code, config, and documentation
- **102 KB First Load JS** for the Carbon-branded dashboard
- **3 second** Next.js build time

A single developer shipped all of it in 25 commits over roughly two weeks of focused work. The framework was never "here's a 50-person team with a Carbon Design System budget" — it was "pair with Claude Code, make decisions fast, ship when it works."

---

## Where to Go Next

- **Repository**: [github.com/openautonomyx/autonomyx-fast-saas-toolkit](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit)
- **Install the CLI**: `npm install -g @autonomyx/fast-saas`
- **Scaffold a project**: `fast-saas init my-saas`
- **Read the architecture doc**: [docs/architecture.md](../docs/architecture.md)
- **Read the deployment guide**: [docs/deployment.md](../docs/deployment.md)
- **Sponsor the project**: [github.com/sponsors/openautonomyx](https://github.com/sponsors/openautonomyx)

The toolkit is MIT licensed. Fork it, strip the parts you don't need, add the parts you do. The whole point is to give you a running start without locking you into anyone's opinions — including the toolkit's own.
