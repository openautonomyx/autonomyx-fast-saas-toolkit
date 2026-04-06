# NocoDB Admin Dashboard Configuration

## Post-Setup Steps

1. **Access NocoDB**: https://admin.DOMAIN
2. **Create a base** connected to the `saas` PostgreSQL database
3. **Create views** for: Tenants, Users, Memberships, API Keys, Usage Events
4. **Build admin forms** for tenant management
5. **Set up API tokens** for programmatic access

## Connecting to the SaaS Database

In NocoDB, create a new base with:
- Type: PostgreSQL
- Host: `postgres`
- Port: `5432`
- Database: `saas`
- User: value of `POSTGRES_USER`
- Password: value of `POSTGRES_PASSWORD`

This gives you a spreadsheet interface over your tenant data.

## Recommended Views

| Table | View | Purpose |
|---|---|---|
| `tenants` | Gallery | Visual tenant cards with plan badges |
| `tenants` | Kanban | Group by plan (free/starter/pro/enterprise) |
| `users` | Grid | Searchable user directory |
| `usage_events` | Calendar | Activity timeline |
| `api_keys` | Grid | API key management with revocation |

## Admin API

NocoDB exposes a REST API for every table:
```bash
curl https://admin.DOMAIN/api/v1/db/data/v1/saas/tenants \
  -H "xc-token: YOUR_NOCODB_TOKEN"
```
