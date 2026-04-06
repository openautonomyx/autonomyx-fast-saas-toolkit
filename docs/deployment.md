# Deployment Guide

## Local Development

```bash
cd my-saas
cp .env.example .env
# Set DOMAIN=localhost in .env
make setup
make up
```

The `docker-compose.override.yml` automatically:
- Exposes all internal ports (5432, 6379, 3001, 3000, etc.)
- Sets `DOMAIN=localhost` for Caddy (disables HTTPS)

Access services at `http://localhost:PORT`.

## Staging (Single VPS)

### Requirements
- VPS with 4+ GB RAM, 20+ GB disk (Hetzner CX31, DigitalOcean 4GB, etc.)
- Docker Engine 24+ installed
- Domain with DNS access

### Steps

1. **Set up DNS** — point wildcard `*.staging.yourdomain.com` to VPS IP:
   ```
   *.staging.yourdomain.com  A  YOUR_VPS_IP
   ```

2. **Clone and configure:**
   ```bash
   git clone https://github.com/YOUR_ORG/your-saas.git
   cd your-saas
   cp .env.example .env
   # Edit .env: DOMAIN=staging.yourdomain.com, real secrets
   ```

3. **Start without the override** (production mode):
   ```bash
   docker compose -f docker-compose.yml --profile essential --profile core --profile ops up -d
   ```

4. **Create databases and verify:**
   ```bash
   ./scripts/setup.sh
   ./scripts/health-check.sh
   ```

Caddy automatically provisions Let's Encrypt certificates for all subdomains.

## Production (Coolify)

### Requirements
- Coolify instance with API access
- Server with 4-8 GB RAM
- Domain with wildcard DNS

### Using the CLI

```bash
fast-saas deploy
```

### Using the Claude Skill

```
/fast-saas-toolkit
> deploy to production
```

The skill's Deploy mode walks through:
1. Pre-flight checks (.env validation, DNS verification)
2. Coolify API connection
3. Service-by-service deployment in dependency order
4. Health verification
5. Post-deployment service configuration

### Manual Coolify Deployment

1. Create a Coolify project for the SaaS stack
2. Add a Docker Compose resource pointing to your repo
3. Set environment variables in Coolify UI (copy from `.env`)
4. Deploy — Coolify handles builds, networking, and SSL

## Resource Sizing

| Profile | vCPU | RAM | Disk | Monthly Cost |
|---|---|---|---|---|
| Minimal (essential + core) | 2 | 4 GB | 20 GB | ~$12-24 |
| Standard (+ ops) | 3 | 6 GB | 30 GB | ~$18-36 |
| Full (+ all growth) | 4 | 8 GB | 40 GB | ~$24-48 |

Costs based on Hetzner Cloud (EU) / DigitalOcean (US) pricing.

## Backups

Automated via the n8n `backup-schedule.json` workflow (daily at 3am) or manually:

```bash
./scripts/backup.sh
```

Backs up all PostgreSQL databases to `backups/` as timestamped gzip files. For production, add offsite backup (S3/RustFS bucket) to the n8n workflow.

## Scaling

The single-server Docker Compose setup handles most SaaS products up to ~1,000 tenants. Beyond that:

1. **Separate PostgreSQL** — Move to managed PostgreSQL (e.g., Supabase, Neon, or RDS)
2. **Separate Redis** — Move to managed Redis (e.g., Upstash, Elasticache)
3. **Horizontal scaling** — Run multiple app instances behind Caddy with load balancing
4. **CDN** — Add Cloudflare or similar for static assets and DDoS protection
