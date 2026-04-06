# Architecture

## System Overview

The toolkit orchestrates 17 open-source services into a single Docker Compose stack, connected through a shared internal network with Caddy as the single entry point.

```
                          Internet
                             │
                      ┌──────┴──────┐
                      │    Caddy    │  :80/:443 (auto-HTTPS)
                      │  (reverse   │
                      │   proxy)    │
                      └──────┬──────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
     ┌──────┴──────┐  ┌─────┴─────┐  ┌──────┴──────┐
     │    Core     │  │    Ops    │  │   Growth    │
     │             │  │           │  │             │
     │  Logto      │  │ GlitchTip │  │ Matomo      │
     │  Lago       │  │ Uptime K. │  │ Mautic      │
     │  RustFS     │  │ Grafana   │  │ Stalwart    │
     │             │  │ Prometheus│  │ NocoDB      │
     │             │  │ Loki      │  │ n8n         │
     └──────┬──────┘  └─────┬─────┘  │ Appsmith    │
            │                │        │ Docmost     │
            │                │        │ PostHog     │
            └────────┬───────┘        └──────┬──────┘
                     │                       │
              ┌──────┴──────┐                │
              │  Essential  │────────────────┘
              │             │
              │ PostgreSQL  │
              │ Redis       │
              └─────────────┘
```

## Network Architecture

All services run on a shared Docker bridge network (`saas-internal`). Only Caddy is connected to the `saas-public` network and exposes ports 80/443 to the host.

**Internal DNS:** Docker Compose provides automatic service discovery. Services reference each other by name (e.g., `postgres:5432`, `redis:6379`, `logto:3001`).

**No ports exposed in production** except 80, 443, and mail ports (25, 587, 993 for Stalwart). The `docker-compose.override.yml` exposes internal ports for local development only.

## Data Flow

### Request Path

```
Client → Caddy (TLS termination)
  → Auth Guard middleware (validates Logto JWT)
  → Tenant Context middleware (loads tenant from DB)
  → Rate Limiter middleware (Redis sliding window)
  → Usage Tracker middleware (buffers to Redis → flushes to PostgreSQL → forwards to Lago)
  → Your Route Handler
  → Response
```

### Multi-Tenancy Model

**Isolation strategy:** Row-level isolation with `tenant_id` column.

```
tenants ──< tenant_memberships >── users
   │
   ├── api_keys
   └── usage_events
```

Every tenant-scoped table includes a `tenant_id` foreign key. The middleware automatically filters queries by the authenticated tenant.

**Plan enforcement:** The `FeatureFlags` class checks the tenant's plan against configurable limits (API calls/month, storage MB, team members) and feature gates.

### Billing Flow

```
API Request
  → Usage Tracker (middleware)
  → Redis buffer (RPUSH)
  → Periodic flush (every 30s)
  → PostgreSQL (usage_events table)
  → Lago API (billing event)
  → Invoice generation (monthly)
  → Payment provider (Stripe/GoCardless)
```

### Monitoring Flow

```
Services → Prometheus (scrapes /metrics every 15s)
  → Grafana (dashboards + alerts)

Services → stdout/stderr → Loki (log aggregation)
  → Grafana (log queries)

Caddy → Uptime Kuma (health checks every 60s)
  → Status page (public)

Application → GlitchTip (Sentry SDK)
  → n8n webhook (error alerts)
```

## Database Architecture

### PostgreSQL (shared)

All services except Matomo share a single PostgreSQL 16 instance with separate databases:

| Database | Owner |
|---|---|
| `saas` | Your application (tenants, users, etc.) |
| `logto` | Logto auth service |
| `lago` | Lago billing service |
| `glitchtip` | GlitchTip error tracking |
| `nocodb` | NocoDB admin dashboard |
| `n8n` | n8n workflow automation |
| `docmost` | Docmost documentation |
| `mautic` | Mautic email marketing |
| `posthog` | PostHog analytics |

### MariaDB (Matomo only)

Matomo requires MySQL/MariaDB and gets its own dedicated `matomo-db` container. This adds ~50 MB RAM overhead but avoids forcing all services onto MySQL.

### Redis (shared)

Redis 7 with database isolation by index:

| DB Index | Service |
|---|---|
| 0 | Default (Lago, sessions, rate limiting) |
| 1 | GlitchTip |
| 2 | Docmost |
| 3 | PostHog |

## Docker Compose Profiles

Services are organized into profiles that control which services start:

| Profile | Services | Default |
|---|---|---|
| `essential` | PostgreSQL, Redis, Caddy | Always on |
| `core` | Logto, Lago, RustFS | On by default |
| `ops` | GlitchTip, Uptime Kuma, Grafana stack | On by default |
| `growth` | Matomo, Mautic, Stalwart, NocoDB, n8n, Appsmith, Docmost, PostHog | Opt-in |

Set active profiles in `.env`:
```
COMPOSE_PROFILES=essential,core,ops
```

## Volume Strategy

Every stateful service has a named Docker volume for data persistence. Volumes survive `docker compose down` (only destroyed with `docker compose down -v`).

The `scripts/backup.sh` dumps all PostgreSQL databases to timestamped gzip files.
