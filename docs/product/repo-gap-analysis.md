# Repo Gap Analysis: Toolkit → Product

## Executive Summary

The repository is a strong **technical foundation** but not yet a complete commercial product. It already includes:

- Monorepo package boundaries for API, CLI, MCP, starter, dashboard, and agent.
- Multi-tenant middleware and a broad service catalog.
- Environment generation, health checks, Docker-first deployment primitives.

However, there are product-critical gaps for first-time users and paid adoption:

- No cohesive end-user onboarding flow across CLI + dashboard.
- No docs portal app (only Markdown docs in-repo).
- No enforceable licensing/entitlement system for Pro/Enterprise modules.
- No hosted control plane implementation.
- Deployment docs reference commands/features not implemented in CLI.

## Audit: Production-Usable Today

## 1) Strong / production-leaning components

### CLI scaffolding and module composition
- `fast-saas init` provides a guided setup with module selection and dependency resolution.
- Outputs `.env`, `docker-compose.yml`, `Caddyfile`, scripts, and manifest.
- Includes `fast-saas env` validation and regeneration path.

### API and tenancy primitives
- API route segmentation for tenants, users, plans, usage, admin, and AI service integrations.
- Middleware package includes auth guard, tenant context, rate limiting, feature flags, and usage tracking.

### Starter deployment baseline
- Docker Compose starter with profiles and environment template.
- Operational scripts (`setup`, `seed`, `backup`, `health-check`) in starter package.

### Dashboard baseline
- Next.js dashboard can show platform stats and service health.
- Tenant list/detail pages exist and integrate with API.

## 2) Placeholder/demo-level components

### Incomplete product flows
- Tenants page includes an explicitly disabled “New tenant” action marked for a later wave.
- No guided onboarding wizard in the dashboard for first run.

### Docs and UX packaging gaps
- Documentation is present but split as repository markdown and not a branded docs portal.
- No clear default “hello production” path from landing page → signup → bootstrap → deploy.

### Deployment maturity gaps
- Deployment docs mention `fast-saas deploy`, but the CLI command is not implemented.
- Kubernetes path is not defined beyond high-level statements.

### Monetization and trust gaps
- No edition gating or entitlement checks across modules.
- No support workflow (SLA intake, escalation, account tagging) implementation.
- No pricing/feature matrix embedded in product UI.

## 3) Critical inconsistencies to fix first

1. **Docs-to-product mismatch** (feature claims vs implemented commands).
2. **Onboarding fragmentation** (CLI, dashboard, docs are separate experiences).
3. **Monetization missing in runtime** (pricing exists only conceptually).
4. **No hosted plane architecture delivery** (important for commercial conversion).

## Proposed Folder / Package Changes

## New packages

- `packages/web` — marketing landing site + pricing + case studies.
- `packages/docs-portal` — public docs app with versioning and search.
- `packages/control-plane` — hosted admin APIs (orgs, licenses, telemetry, support).
- `packages/onboarding` — reusable onboarding state machine + UI components.
- `packages/licensing` — entitlement verification SDK and policy evaluator.

## CLI changes

- Add `packages/cli/src/commands/preflight.ts`
- Add `packages/cli/src/commands/deploy.ts`
- Add `packages/cli/src/commands/onboard.ts`
- Add `packages/cli/src/validators/` for environment/domain/secrets checks.

## Starter changes

- `packages/starter/profiles/` for opinionated profile templates (`minimal`, `growth`, `ai`).
- `packages/starter/bootstrap/` for first-run bootstrap + sample tenant seeding.
- `packages/starter/security/` for hardened production defaults and policies.

## Dashboard changes

- Add `/onboarding` route group.
- Add `/health` deep diagnostics page.
- Add `/billing` and `/licenses` pages (edition awareness).

## Docs and collateral

- `docs/product/` (this folder) for product planning artifacts.
- `docs/diagrams/` for Mermaid + exported architecture images.
- `docs/case-studies/` normalized customer proof assets.

