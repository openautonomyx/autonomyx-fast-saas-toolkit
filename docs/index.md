# Quick Start

Get a full enterprise SaaS stack running in under 5 minutes.

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- 4 GB RAM minimum (8 GB for full stack)
- A domain with DNS access (or `localhost` for local dev)

## Option A: Using the CLI

```bash
# Install globally
npm install -g @autonomyx/fast-saas

# Scaffold a new project
fast-saas init my-saas

# Follow the interactive wizard:
#   1. Domain
#   2. Admin email
#   3. Select modules (Core, Ops, Growth)

# Start services
cd my-saas
make up

# Verify everything is healthy
make health
```

## Option B: Clone the Starter

```bash
git clone https://github.com/openautonomyx/autonomyx-fast-saas-toolkit.git
cd autonomyx-fast-saas-toolkit/packages/starter

# Configure environment
cp .env.example .env
# Edit .env — set DOMAIN, ADMIN_EMAIL, and review generated secrets

# Create service databases
make setup

# Start core + ops services
make up

# Check health
make health
```

## First 5 Minutes After Launch

1. **Logto (Auth)** — Visit `https://auth-admin.DOMAIN`, create your first application
2. **Lago (Billing)** — Visit `https://billing.DOMAIN`, create Free/Starter/Pro/Enterprise plans
3. **Grafana (Monitoring)** — Visit `https://monitor.DOMAIN`, login with `admin` / your password
4. **GlitchTip (Errors)** — Visit `https://errors.DOMAIN`, create an org + project, copy the DSN
5. **Uptime Kuma (Status)** — Visit `https://status.DOMAIN`, add monitors for each service

## Using the Claude Skill

If you have Claude Code installed:

```
/fast-saas-toolkit
```

Then say: "scaffold a new SaaS project" or "configure billing plans" or "diagnose my stack"

## Service URL Map

| Service | URL | Purpose |
|---|---|---|
| Logto | `auth.DOMAIN` | Authentication, SSO |
| Logto Admin | `auth-admin.DOMAIN` | Auth admin console |
| Lago | `billing.DOMAIN` | Billing dashboard |
| Lago API | `billing-api.DOMAIN` | Billing REST API |
| RustFS | `storage.DOMAIN` | S3-compatible storage |
| RustFS Console | `storage-console.DOMAIN` | Storage admin UI |
| Grafana | `monitor.DOMAIN` | Metrics + dashboards |
| GlitchTip | `errors.DOMAIN` | Error tracking |
| Uptime Kuma | `status.DOMAIN` | Status page |
| Matomo | `analytics.DOMAIN` | Web analytics |
| Mautic | `email.DOMAIN` | Email marketing |
| NocoDB | `admin.DOMAIN` | Admin dashboard |
| n8n | `auto.DOMAIN` | Workflow automation |
| Appsmith | `tools.DOMAIN` | Internal tools |
| Docmost | `docs.DOMAIN` | Documentation |

## Next Steps

- [Architecture Overview](architecture.md) — Understand how services connect
- [CLI Reference](cli-reference.md) — All `fast-saas` commands
- [Module Guides](modules/) — Per-service setup and integration
- [Deployment Guide](deployment.md) — Local → staging → production
- [Security Guide](security.md) — Secrets, network isolation, OIDC


## Productization Docs

- [Repo Gap Analysis](product/repo-gap-analysis.md)
- [Product Requirements Doc](product/product-requirements-doc.md)
- [Technical Architecture](product/technical-architecture.md)
- [Prioritized Roadmap](product/prioritized-roadmap.md)
- [Pricing & Packaging Proposal](product/pricing-packaging-proposal.md)
- [Website Copy](product/website-copy.md)
- [Onboarding UX Copy](product/onboarding-ux-copy.md)
- [v1 Release Checklist](product/release-checklist-v1.md)
