# Customization Guide

## Adding Your Application

1. Add your app service to `docker-compose.yml`:
   ```yaml
   your-app:
     image: your-app:latest
     profiles: ["core"]
     environment:
       DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/saas
       REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
       LOGTO_ENDPOINT: https://auth.${DOMAIN}/oidc
       LAGO_API_URL: https://billing-api.${DOMAIN}
       SENTRY_DSN: https://KEY@errors.${DOMAIN}/PROJECT_ID
     depends_on:
       postgres:
         condition: service_healthy
       redis:
         condition: service_healthy
     networks:
       - saas-internal
   ```

2. Add a Caddy route in `Caddyfile`:
   ```
   app.{$DOMAIN} {
       reverse_proxy your-app:PORT
   }
   ```

3. Add a Prometheus scrape target in `services/prometheus/prometheus.yml`:
   ```yaml
   - job_name: "app"
     static_configs:
       - targets: ["your-app:PORT"]
     metrics_path: /metrics
   ```

## Modifying Pricing Plans

Edit `packages/skill/templates/lago-plans.json` or create plans directly in Lago UI at `billing.DOMAIN`.

To change the middleware's feature flags, edit `packages/starter/middleware/src/feature-flags.ts`:

```typescript
export const defaultPlans: Record<string, PlanLimits> = {
  free: {
    api_calls_per_month: 1000,  // Change limits here
    storage_mb: 100,
    team_members: 1,
    features: {
      core: true,
      your_feature: false,  // Add custom feature gates
    },
  },
  // ...
};
```

## Adding a New Service

1. **Define the module** in `packages/cli/src/modules/registry.ts`:
   ```typescript
   const myService: ModuleDefinition = {
     id: "my-service",
     name: "My Service",
     description: "What it does",
     group: "growth",
     defaultEnabled: false,
     dependencies: ["postgres"],
     image: "myorg/myservice:latest",
     ports: { web: 8080 },
     envVars: [...],
     healthCheck: { path: "/health", port: 8080 },
     caddyRoutes: [{ subdomain: "myservice", target: "my-service:8080" }],
     volumes: ["myservice-data:/data"],
   };
   ```

2. **Add to the registry** at the bottom of the file:
   ```typescript
   export const MODULE_REGISTRY = { ...existing, "my-service": myService };
   ```

3. **Add compose environment** in `packages/cli/src/generators/compose.ts` `buildEnvironment()`.

4. **Rebuild CLI**: `pnpm --filter cli build`

## Changing the Auth Provider

To swap Logto for Keycloak or Authentik:

1. Replace the `logto` module definition in the registry
2. Update the `auth-guard.ts` middleware to validate JWTs from the new provider
3. Update the JWKS endpoint URL and claim mappings
4. Regenerate the project: `fast-saas init`

The middleware is provider-agnostic — it validates standard OIDC JWTs. Only the JWKS URL and claim names need to change.

## Changing the Database

To use an external PostgreSQL (e.g., Supabase, Neon, RDS):

1. Remove the `postgres` service from `docker-compose.yml`
2. Update `DATABASE_URL` in `.env` to point to the external database
3. Run `migrations/` against the external database manually
4. Update all services' connection strings

## Custom Middleware

Add middleware to the stack in `packages/starter/middleware/src/`:

```typescript
// Example: IP allowlist middleware
export function createIpAllowlist(allowedIps: string[]) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
    if (allowedIps.includes(ip)) return next();
    res.writeHead(403).end();
  };
}
```

Export from `index.ts` and add to your app's middleware chain.
