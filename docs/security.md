# Security Guide

## Secret Management

### Auto-Generated Secrets

The CLI generates cryptographically random secrets using `crypto.randomBytes(32)` for all sensitive values. Never commit the `.env` file — only `.env.example`.

### Secret Rotation

To regenerate all secrets:
```bash
fast-saas env --regenerate
```

This creates new secrets but does NOT update running services. After regeneration:
1. Stop services: `make down`
2. Start services: `make up`
3. Re-configure services that cache credentials

### Required Secrets

| Variable | Used By | Type |
|---|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL | Database password |
| `REDIS_PASSWORD` | Redis | Cache password |
| `LAGO_SECRET_KEY` | Lago | Rails secret key |
| `LAGO_RSA_PRIVATE_KEY` | Lago | JWT signing key |
| `LAGO_ENCRYPTION_*` (3 keys + salt) | Lago | Data encryption |
| `GLITCHTIP_SECRET_KEY` | GlitchTip | Django secret |
| `GRAFANA_ADMIN_PASSWORD` | Grafana | Admin login |
| `RUSTFS_ACCESS_KEY` / `SECRET_KEY` | RustFS | S3 credentials |
| `NOCODB_JWT_SECRET` | NocoDB | API auth |
| `N8N_ENCRYPTION_KEY` | n8n | Credential encryption |
| `DOCMOST_SECRET` | Docmost | App secret |
| `MATOMO_DB_PASSWORD` | Matomo | MariaDB password |
| `MAUTIC_ADMIN_PASSWORD` | Mautic | Admin login |
| `SMTP_PASSWORD` | Stalwart | Mail auth |

## Network Isolation

### Docker Networks

- `saas-internal` — All services communicate here. Not exposed to host.
- `saas-public` — Only Caddy. Exposes ports 80 and 443.

In production, **only Caddy receives external traffic**. All other services are unreachable from the internet.

### Port Exposure

**Production** (`docker-compose.yml` only):
- 80, 443 (Caddy)
- 25, 587, 993 (Stalwart mail — if enabled)

**Development** (`docker-compose.override.yml` adds):
- All internal ports for direct debugging

## Authentication Flow

```
Client → Caddy (TLS) → Your App
  → Auth Guard middleware
    → Extracts Bearer token from Authorization header
    → Validates JWT against Logto JWKS endpoint
    → Verifies issuer, audience, and expiry
    → Extracts: userId, organization_id (tenant), scopes
  → Tenant Context middleware
    → Loads tenant from PostgreSQL
    → Checks tenant status (active/suspended)
    → Checks user membership and role
  → Rate Limiter (per-tenant limits)
  → Route Handler
```

### API Key Authentication

For programmatic access, the middleware also supports API keys:
- Keys are prefixed with `sk_` for identification
- Only the bcrypt hash is stored (`key_hash` column)
- The full key is shown once at creation and never again
- Keys have scopes, expiry, and per-tenant isolation

## Rate Limiting

Sliding-window rate limiter using Redis sorted sets:

| Plan | Requests/minute |
|---|---|
| Unauthenticated (by IP) | 100 |
| Free | 60 |
| Starter | 300 |
| Pro | 1,000 |
| Enterprise | 5,000 |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## TLS / HTTPS

Caddy automatically provisions and renews Let's Encrypt certificates for all configured subdomains. No manual certificate management needed.

Requirements:
- Domain DNS must resolve to the server
- Ports 80 and 443 must be accessible from the internet
- For local development, set `DOMAIN=localhost` (Caddy serves HTTP)

## Data Isolation

Row-level tenant isolation is enforced by the middleware:
- Every query is scoped by `tenant_id`
- The middleware sets the tenant context before any route handler runs
- Cross-tenant data access is blocked at the middleware level

## Audit Trail

Usage events in the `usage_events` table serve as an audit trail:
- Every API call is logged with tenant_id, method, path, and timestamp
- Events are retained for 90 days (configurable)
- The `usage_summary` PostgreSQL view provides aggregated daily counts
