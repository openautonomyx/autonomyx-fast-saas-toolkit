# Lago Billing Configuration

## Post-Setup Steps

1. **Access Lago UI**: https://billing.DOMAIN
2. **Create billing plans**: Free, Starter, Pro, Enterprise
3. **Configure billable metrics** (e.g., `api_calls`, `storage_mb`, `team_members`)
4. **Set up webhooks** pointing to n8n: `https://auto.DOMAIN/webhook/lago-webhook`
5. **Connect a payment provider** (Stripe, GoCardless, or Adyen)

## Recommended Plan Structure

```
Free:       $0/mo   | 1,000 API calls | 100 MB storage  | 1 member
Starter:   $29/mo   | 10,000 API calls | 1 GB storage   | 5 members
Pro:       $99/mo   | 100,000 API calls | 10 GB storage  | 25 members
Enterprise: Custom  | Unlimited        | Unlimited       | Unlimited
```

## Usage Event Integration

The middleware's `usage-tracker` automatically sends events to Lago:

```typescript
// Events are buffered in Redis and flushed to Lago every 30 seconds
// Event format sent to Lago:
{
  transaction_id: "uuid",
  external_subscription_id: "tenant_id",
  code: "api_call",
  timestamp: 1234567890,
  properties: { method: "GET", path: "/api/v1/..." }
}
```

## Environment Variables

| Variable | Description |
|---|---|
| `LAGO_SECRET_KEY` | Rails secret key base |
| `LAGO_RSA_PRIVATE_KEY` | JWT signing key |
| `LAGO_ENCRYPTION_*` | Three encryption keys + salt |
