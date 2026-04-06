# Logto — Authentication & SSO

Logto provides OIDC-based authentication with built-in multi-tenant organizations, social login connectors, and management API.

## URLs

| Endpoint | URL |
|---|---|
| User-facing auth | `auth.DOMAIN` |
| Admin console | `auth-admin.DOMAIN` |

## Setup

1. Open `https://auth-admin.DOMAIN`
2. Create an application (SPA, Traditional Web, or Machine-to-Machine)
3. Add sign-in methods (email/password, Google, GitHub, etc.)
4. Create an organization for each tenant
5. Configure webhooks for user events

## Integration with Middleware

The `@autonomyx/saas-middleware` auth guard validates Logto JWTs:

```typescript
import { createAuthGuard } from '@autonomyx/saas-middleware';

app.use(createAuthGuard({
  logtoEndpoint: 'https://auth.YOUR_DOMAIN/oidc',
  audience: 'https://api.YOUR_DOMAIN',
  publicPaths: ['/health', '/api/public'],
}));
```

The JWT contains `organization_id` which maps to your `tenants.id`.

## Multi-Tenant Flow

```
User signs up → Logto creates user
  → Your app creates tenant + membership
  → User selects organization in Logto
  → JWT includes organization_id
  → Auth Guard extracts tenant context
```

## Environment Variables

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL connection (auto-configured) |
| `ENDPOINT` | Public auth URL |
| `ADMIN_ENDPOINT` | Admin console URL |
