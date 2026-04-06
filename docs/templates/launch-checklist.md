# SaaS Launch Checklist

Use this checklist before going live with your SaaS product.

## Infrastructure

- [ ] Domain DNS configured (wildcard A record for all subdomains)
- [ ] SSL certificates provisioning (Caddy auto-handles this)
- [ ] All `.env` values are production secrets (no `CHANGE_ME`)
- [ ] Server meets resource requirements (4+ GB RAM for standard profile)
- [ ] Firewall configured (only 80, 443, and mail ports open)
- [ ] Automated backups configured (n8n backup-schedule workflow active)
- [ ] Offsite backup destination set up (S3 bucket or external storage)

## Authentication

- [ ] Logto application created for your app
- [ ] Sign-in methods configured (email/password + social)
- [ ] Organizations created for multi-tenancy
- [ ] Branding customized (logo, colors, email templates)
- [ ] Password policy configured (minimum length, complexity)
- [ ] Session timeout configured

## Billing

- [ ] Lago plans created (Free, Starter, Pro, Enterprise)
- [ ] Billable metrics configured (api_calls, storage, etc.)
- [ ] Payment provider connected (Stripe, GoCardless, or Adyen)
- [ ] Webhooks configured (pointing to n8n billing-sync workflow)
- [ ] Invoice templates customized
- [ ] Tax configuration set up

## Monitoring

- [ ] Grafana dashboards verified (SaaS Overview, Tenant Usage, Infrastructure, Billing)
- [ ] Prometheus alert rules active (ServiceDown, HighErrorRate, etc.)
- [ ] GlitchTip project created, DSN integrated in app
- [ ] Uptime Kuma monitors added for all services
- [ ] Public status page created
- [ ] Alert notification channels configured (email, Slack, webhook)

## Email

- [ ] Stalwart domain configured
- [ ] DNS records set: MX, SPF, DKIM, DMARC
- [ ] Transactional email tested (password reset, welcome)
- [ ] Mautic SMTP configured and connected
- [ ] Welcome email campaign active
- [ ] Onboarding drip campaign active

## Application

- [ ] Multi-tenancy middleware integrated
- [ ] Auth guard validates Logto JWTs
- [ ] Rate limiting active
- [ ] Usage tracking sends events to Lago
- [ ] Feature flags enforce plan limits
- [ ] Error handling sends to GlitchTip
- [ ] Analytics tracking code installed (Matomo or PostHog)

## Admin

- [ ] NocoDB admin base created (tenants, users, usage views)
- [ ] Seed data cleaned (remove sample tenant/user)
- [ ] Admin access restricted to authorized users
- [ ] n8n workflows tested and activated

## Legal & Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent configured (Matomo respects DNT)
- [ ] Data processing agreement available
- [ ] GDPR data export/deletion capability

## Launch

- [ ] Load testing completed
- [ ] Staging environment matches production
- [ ] Rollback plan documented
- [ ] Team trained on admin tools
- [ ] Customer support channel ready
- [ ] Launch announcement prepared
