# n8n Workflow Automation Configuration

## Post-Setup Steps

1. **Access n8n**: https://auto.DOMAIN
2. **Import pre-built workflows** from `n8n-workflows/` directory
3. **Configure credentials**: PostgreSQL (SaaS DB), SMTP (Stalwart)
4. **Activate workflows** after testing

## Pre-Built Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `welcome-email.json` | Webhook: `POST /tenant-signup` | Send welcome email on signup |
| `usage-alert.json` | Hourly schedule | Alert when tenants near limits |
| `error-alert.json` | Webhook from GlitchTip | Forward critical errors |
| `backup-schedule.json` | Daily at 3am | Automated database backups |
| `billing-sync.json` | Webhook from Lago | Sync billing events |
| `onboarding-flow.json` | Webhook: `POST /onboarding-start` | 3-day drip campaign |

## Importing Workflows

In n8n UI: Settings → Import from File → select JSON from `n8n-workflows/`

Or via API:
```bash
curl -X POST https://auto.DOMAIN/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @n8n-workflows/welcome-email.json
```

## PostgreSQL Credential Setup

When configuring the "SaaS DB" credential in n8n:
- Host: `postgres`
- Port: `5432`
- Database: `saas`
- User: value of `POSTGRES_USER`
- Password: value of `POSTGRES_PASSWORD`
