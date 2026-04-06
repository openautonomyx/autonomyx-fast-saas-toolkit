# Uptime Kuma Monitoring Configuration

## Post-Setup Steps

1. **Access Uptime Kuma**: https://status.DOMAIN
2. **Create your admin account**
3. **Add monitors** for each service (see table below)
4. **Create a status page** for your customers
5. **Set up notifications** (email, Slack, webhook)

## Recommended Monitors

| Service | Type | URL | Interval |
|---|---|---|---|
| App | HTTP(s) | https://app.DOMAIN | 60s |
| Auth (Logto) | HTTP(s) | https://auth.DOMAIN/api/status | 60s |
| Billing API | HTTP(s) | https://billing-api.DOMAIN/health | 120s |
| Storage | HTTP(s) | https://storage.DOMAIN/minio/health/live | 120s |
| PostgreSQL | TCP | postgres:5432 | 60s |
| Redis | TCP | redis:6379 | 60s |

## Status Page

Create a public status page at `status.DOMAIN` showing:
- Core services (App, Auth, Billing)
- Infrastructure (Database, Cache, Storage)
- External integrations

This gives your customers transparency without exposing internal details.
