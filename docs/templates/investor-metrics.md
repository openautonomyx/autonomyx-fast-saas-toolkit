# Investor Metrics Template

Key SaaS metrics your Grafana dashboards and Lago billing data can power. Use this as a template for board reports and investor updates.

## Monthly Report Template

### Revenue Metrics (from Lago)

| Metric | This Month | Last Month | MoM Change |
|---|---|---|---|
| MRR (Monthly Recurring Revenue) | $X,XXX | $X,XXX | +X% |
| ARR (Annual Run Rate) | $XX,XXX | $XX,XXX | +X% |
| New MRR | $XXX | $XXX | |
| Expansion MRR | $XXX | $XXX | |
| Churned MRR | -$XXX | -$XXX | |
| Net New MRR | $XXX | $XXX | |
| ARPU (Avg Revenue Per User) | $XX | $XX | |

### Growth Metrics (from PostgreSQL + Lago)

| Metric | This Month | Last Month |
|---|---|---|
| Total tenants | XXX | XXX |
| New signups | XX | XX |
| Trial → Paid conversion rate | XX% | XX% |
| Churn rate | X.X% | X.X% |
| Net revenue retention | XXX% | XXX% |

### Engagement Metrics (from Matomo + Usage Events)

| Metric | This Month | Last Month |
|---|---|---|
| DAU (Daily Active Users) | XXX | XXX |
| WAU (Weekly Active Users) | XXX | XXX |
| MAU (Monthly Active Users) | XXX | XXX |
| DAU/MAU ratio (stickiness) | XX% | XX% |
| API calls (total) | X.XM | X.XM |
| Avg API calls per tenant | X,XXX | X,XXX |

### Infrastructure Metrics (from Grafana)

| Metric | Current |
|---|---|
| Uptime (30d) | XX.XX% |
| Avg API latency (p50) | XXms |
| Avg API latency (p95) | XXXms |
| Error rate | X.XX% |
| Infrastructure cost | $XX/mo |
| Gross margin | XX% |

## Where to Find Each Metric

| Metric | Source | Dashboard/Query |
|---|---|---|
| MRR, ARR, ARPU | Lago API | Billing Overview dashboard |
| Signups, churn | `tenants` table | Tenant Usage dashboard |
| Conversion rate | Lago subscriptions | Billing Overview dashboard |
| DAU/WAU/MAU | Matomo | Matomo → Visitors → Overview |
| API calls | `usage_events` table | SaaS Overview dashboard |
| Uptime | Uptime Kuma | Status page |
| Latency | Prometheus | Infrastructure dashboard |
| Error rate | Prometheus | SaaS Overview dashboard |
| Infra cost | Server hosting bill | Manual input |

---

*All metrics in this template can be automatically collected from the toolkit's services. For automated reporting, create an n8n workflow that queries each source and emails a formatted report monthly.*
