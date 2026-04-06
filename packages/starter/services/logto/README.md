# Logto Configuration

## Post-Setup Steps

1. **Access admin console**: https://auth-admin.DOMAIN
2. **Create your first application** (SPA, Traditional Web, or Machine-to-Machine)
3. **Configure sign-in methods**: Email + password, social connectors (Google, GitHub, etc.)
4. **Set up organizations** for multi-tenant isolation
5. **Configure webhooks** to notify your app on user events

## Connecting to Your Application

```typescript
// Install: npm install @logto/express
import { LogtoExpressConfig } from '@logto/express';

const config: LogtoExpressConfig = {
  endpoint: 'https://auth.YOUR_DOMAIN',
  appId: 'YOUR_APP_ID',
  appSecret: 'YOUR_APP_SECRET',
  baseUrl: 'https://app.YOUR_DOMAIN',
};
```

## Organization-Based Multi-Tenancy

Logto Organizations map 1:1 to your `tenants` table. When a user authenticates,
the JWT includes an `organization_id` claim that the middleware uses to resolve
the tenant context.

```
User → Logto Auth → JWT { sub, organization_id, roles } → Auth Guard → Tenant Context
```

## Environment Variables

| Variable | Description |
|---|---|
| `DB_URL` | Auto-configured to PostgreSQL |
| `ENDPOINT` | Public-facing auth URL |
| `ADMIN_ENDPOINT` | Admin console URL |
