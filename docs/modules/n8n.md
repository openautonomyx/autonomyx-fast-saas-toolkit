# n8n — Workflow Automation

n8n provides visual workflow automation connecting all toolkit services via webhooks, schedules, and API calls.

## URL

`auto.DOMAIN`

## Pre-Built Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| Welcome Email | Webhook: `POST /tenant-signup` | Onboarding email on signup |
| Usage Alert | Hourly schedule | Alert when tenants near limits |
| Error Alert | Webhook from GlitchTip | Forward critical errors |
| Backup Schedule | Daily at 3am | Automated database backups |
| Billing Sync | Webhook from Lago | Process billing events |
| Onboarding Flow | Webhook: `POST /onboarding-start` | 3-day drip campaign |

## Importing Workflows

In n8n UI: **Settings → Import from File** → select JSON from `n8n-workflows/`

Or via API:
```bash
curl -X POST https://auto.DOMAIN/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @n8n-workflows/welcome-email.json
```

## Credential Setup

Create these credentials in n8n for the workflows to function:

**SaaS DB (PostgreSQL):**
- Host: `postgres` | Port: `5432` | Database: `saas`
- User: `POSTGRES_USER` value | Password: `POSTGRES_PASSWORD` value

**SMTP (Stalwart):**
- Host: `stalwart` | Port: `25` | Security: None (internal network)
- User: `noreply@DOMAIN` | Password: `SMTP_PASSWORD` value

## Creating Custom Workflows

Common patterns for SaaS automation:
- **Tenant lifecycle:** signup → welcome → onboarding → upgrade prompt → renewal
- **Alerting:** service health → threshold check → notify team
- **Data sync:** external API → transform → database update
- **Reporting:** schedule → query DB → format → email/Slack
