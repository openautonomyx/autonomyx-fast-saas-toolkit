# Grafana Stack — Metrics, Dashboards, Logs

The Grafana stack bundles three services: Grafana (dashboards), Prometheus (metrics), and Loki (logs).

## URLs

| Endpoint | URL |
|---|---|
| Grafana | `monitor.DOMAIN` |
| Prometheus | Internal only (`:9090`) |
| Loki | Internal only (`:3100`) |

## Pre-Built Dashboards

Three dashboards are auto-provisioned:

### SaaS Overview
- Active tenant count
- API request rate (5m)
- Error rate percentage
- Service health table

### Tenant Usage
- API calls by tenant (24h bar chart)
- Tenants near usage limits
- P95 latency by tenant
- Storage usage by tenant
- Active users by tenant

### Infrastructure
- Container CPU and memory usage
- PostgreSQL connection count
- Redis memory usage
- Disk usage percentage
- Network I/O per container
- Service uptime percentages
- Error log stream (Loki)

### Billing Overview
- Monthly Recurring Revenue (MRR)
- Active subscriptions count
- Churn count (30d)
- Trial-to-paid conversion rate
- Revenue by plan (pie chart)
- Usage event rate
- Pending invoices

## Alert Rules

Prometheus alert rules fire on:

| Alert | Condition | Severity |
|---|---|---|
| ServiceDown | `up == 0` for 2m | critical |
| HighErrorRate | >5% errors for 5m | warning |
| HighLatency | p95 > 2s for 5m | warning |
| HighCPU | >80% for 10m | warning |
| HighMemory | >85% for 5m | warning |
| DiskSpaceLow | <15% free for 5m | critical |
| PostgresConnectionsHigh | >80 active | warning |
| RedisMemoryHigh | >80% used | warning |
| TenantOverLimit | >90% of plan limit | info |
| BillingWebhookFailure | >5 failures/hour | warning |

## Adding Custom Dashboards

Place JSON files in `grafana-dashboards/` — they are auto-provisioned on Grafana startup.

## Adding Application Metrics

Expose a `/metrics` endpoint in your app (Prometheus format), then add a scrape target in `services/prometheus/prometheus.yml`:

```yaml
- job_name: "app"
  static_configs:
    - targets: ["your-app:PORT"]
  metrics_path: /metrics
```
