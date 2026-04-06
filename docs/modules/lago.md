# Lago — Billing & Subscriptions

Lago handles usage-based billing, subscription management, invoicing, and payment provider integration.

## URLs

| Endpoint | URL |
|---|---|
| Dashboard | `billing.DOMAIN` |
| REST API | `billing-api.DOMAIN` |

## Setup

1. Open `https://billing.DOMAIN` and create your account
2. Create a billable metric: `api_calls` (sum aggregation)
3. Create plans: Free ($0), Starter ($29), Pro ($99), Enterprise (custom)
4. Attach graduated charges to each plan
5. Connect a payment provider (Stripe, GoCardless, or Adyen)
6. Set up webhooks pointing to n8n: `https://auto.DOMAIN/webhook/lago-webhook`

## Plan Templates

The toolkit includes pre-configured plan definitions in `packages/skill/templates/lago-plans.json`:

| Plan | Base Price | Included API Calls | Overage Rate |
|---|---|---|---|
| Free | $0/mo | 1,000 | $0.001/call |
| Starter | $29/mo | 10,000 | $0.0005/call |
| Pro | $99/mo | 100,000 | $0.0002/call |
| Enterprise | Custom | Unlimited | — |

## Usage Event Integration

The middleware's usage tracker automatically sends events to Lago every 30 seconds:

```
API Request → Usage Tracker → Redis Buffer → Flush → Lago Event API
```

Each event includes: `transaction_id`, `external_subscription_id` (tenant_id), `code` (api_call), `timestamp`, and `properties`.

## Webhook Events

Configure Lago to send webhooks for billing events. The pre-built `billing-sync.json` n8n workflow handles:
- `invoice.created` — New invoice generated
- `subscription.terminated` — Customer churned
- `customer.payment_overdue` — Payment failed
