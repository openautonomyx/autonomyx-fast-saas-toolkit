/**
 * @autonomyx/saas-middleware
 *
 * Multi-tenancy middleware for the Autonomyx Fast SaaS Toolkit.
 * Provides tenant isolation, auth, rate limiting, usage tracking, and feature flags.
 *
 * Usage with Express:
 *   import { createTenantContext, createAuthGuard, createRateLimiter } from '@autonomyx/saas-middleware';
 *   app.use(createAuthGuard({ logtoEndpoint: 'https://auth.example.com' }));
 *   app.use(createTenantContext({ db }));
 *   app.use(createRateLimiter({ redis }));
 */

export { createTenantContext, type TenantContext, type Tenant } from "./tenant-context.js";
export { createAuthGuard, type AuthGuardOptions } from "./auth-guard.js";
export { createRateLimiter, type RateLimiterOptions } from "./rate-limiter.js";
export { createUsageTracker, type UsageTrackerOptions } from "./usage-tracker.js";
export { FeatureFlags, type PlanLimits, defaultPlans } from "./feature-flags.js";
export { createHealthCheck, type HealthCheckOptions } from "./health.js";
