# Other Module Guides

Quick setup references for growth modules. For detailed configuration, see each service's README in `services/<name>/`.

---

## GlitchTip — Error Tracking

**URL:** `errors.DOMAIN`

1. Create organization and project
2. Copy the DSN
3. Install Sentry SDK: `npm install @sentry/node`
4. Initialize: `Sentry.init({ dsn: 'https://KEY@errors.DOMAIN/ID' })`
5. Set up alert webhook to n8n: `https://auto.DOMAIN/webhook/glitchtip-alert`

---

## Uptime Kuma — Status Page

**URL:** `status.DOMAIN`

1. Create admin account on first visit
2. Add HTTP monitors for each service (see `services/uptime-kuma/README.md`)
3. Create a public status page
4. Configure notification channels (email, Slack, webhook)

---

## Matomo — Web Analytics

**URL:** `analytics.DOMAIN`

1. Complete setup wizard (auto-detects MariaDB)
2. Add your site: `app.DOMAIN`
3. Copy tracking JS to your application
4. Set up custom dimensions for tenant_id and plan
5. Configure goals: Signup, Upgrade, API Key Created

Note: Matomo uses its own MariaDB container — not the shared PostgreSQL.

---

## Mautic — Email Marketing

**URL:** `email.DOMAIN`

1. Log in with `ADMIN_EMAIL` / `MAUTIC_ADMIN_PASSWORD`
2. Configure SMTP: Host `stalwart`, Port `25`, No encryption
3. Create segments: Trial Users, Starter, Pro, Churned
4. Build campaigns: Welcome, Feature Announcements, Re-engagement
5. Add Mautic tracking JS to your app

---

## Stalwart — Mail Server

**Ports:** 25 (SMTP), 587 (Submission), 993 (IMAPS)

1. Add your domain in Stalwart admin
2. Configure DNS: MX, SPF, DKIM, DMARC records
3. Create mailboxes: `noreply@`, `support@`
4. Other services use Stalwart as SMTP relay (`stalwart:25` internal)

---

## NocoDB — Admin Dashboard

**URL:** `admin.DOMAIN`

1. Create a base connected to the `saas` PostgreSQL database
2. Link tables: tenants, users, memberships, api_keys, usage_events
3. Create views: Tenant Kanban (by plan), User Grid, Usage Calendar
4. Set up API tokens for programmatic access

---

## RustFS — S3 Storage

**URLs:** `storage.DOMAIN` (API), `storage-console.DOMAIN` (UI)

1. Log in with `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY`
2. Create buckets: `uploads`, `avatars`, `exports`, `backups`
3. Use AWS S3 SDK with `forcePathStyle: true`
4. Prefix object keys with `tenant_id/` for isolation

---

## Appsmith — Internal Tools

**URL:** `tools.DOMAIN`

1. Create admin account on first visit
2. Connect data sources: PostgreSQL (`saas` DB), REST APIs
3. Build admin panels: Tenant management, User lookup, Usage dashboards

---

## Docmost — Documentation

**URL:** `docs.DOMAIN`

1. Create admin account on first visit
2. Set up workspace structure: Getting Started, API Reference, Changelog
3. Invite team members for collaborative editing

---

## PostHog — Product Analytics

**URL:** `product.DOMAIN`

1. Complete setup wizard
2. Install SDK: `npm install posthog-js`
3. Configure: events, feature flags, session replay
4. Set up tenant-scoped event properties
