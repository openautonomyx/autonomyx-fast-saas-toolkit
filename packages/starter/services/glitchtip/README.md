# GlitchTip Error Tracking Configuration

## Post-Setup Steps

1. **Access GlitchTip**: https://errors.DOMAIN
2. **Create an organization and project**
3. **Copy the DSN** (Data Source Name)
4. **Install Sentry SDK** in your application (GlitchTip is Sentry-compatible)
5. **Set up alert webhook** to n8n: `https://auto.DOMAIN/webhook/glitchtip-alert`

## Connecting Your Application

```typescript
// Install: npm install @sentry/node
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://KEY@errors.YOUR_DOMAIN/PROJECT_ID',
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
});
```

## Alert Configuration

The pre-built n8n workflow `error-alert.json` receives GlitchTip webhooks
and notifies admins when error count exceeds 5 occurrences.

## Environment Variables

| Variable | Description |
|---|---|
| `GLITCHTIP_SECRET_KEY` | Django secret key |
| `GLITCHTIP_DOMAIN` | Public URL |
| `DEFAULT_FROM_EMAIL` | Sender for alert emails |
