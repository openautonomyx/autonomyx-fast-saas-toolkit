# Technical Architecture (Commercial Product)

## 1) Architecture Overview
Autonomyx Fast SaaS Toolkit should ship as a **productized platform** with five layers:

1. **Starter Kit Runtime** (self-hosted stack, Docker-first)
2. **Hosted Control Plane** (licenses, updates, support, telemetry opt-in)
3. **CLI** (bootstrap, validation, lifecycle, diagnostics)
4. **Admin Dashboard** (tenant, modules, health, onboarding)
5. **Docs + Website** (marketing + developer education)

## 2) Logical Components
- **Data Plane (customer infra):** docker-compose services, Postgres/Redis, reverse proxy, modules.
- **Control Plane (Autonomyx-hosted):** customer org accounts, license keys, feature entitlements, release channels, support ticketing.
- **Developer UX Plane:** CLI + docs + guided flows.

## 3) Starter Profiles
- **minimal:** essential + core (default)
- **standard:** minimal + ops
- **growth:** standard + growth
- **ai:** growth + ai

## 4) Control Plane APIs (v1)
- `POST /v1/licenses/validate`
- `GET /v1/entitlements/:orgId`
- `GET /v1/releases/channel/:track`
- `POST /v1/support/tickets`
- `POST /v1/telemetry/events` (opt-in)

## 5) Security Model
- Signed license tokens validated offline with periodic refresh.
- Env schema blocks weak/default secrets for production mode.
- Role-based admin dashboard (owner/admin/operator).
- Separation between control plane credentials and runtime credentials.

## 6) Deployment Topologies
- Local single-node Docker (developer default).
- VPS single-node with hardened Caddy + backups.
- Coolify app bundle path.
- Future: Kubernetes Helm chart path from same module registry.

## 7) Observability
- Required baseline: health checks + status summary.
- Standard: Prometheus/Loki/Grafana dashboards.
- Enterprise: audit event export + SIEM-friendly stream.

## 8) Upgrade Strategy
- Versioned CLI templates.
- Migration assistant for env and compose diffs.
- Release channels: stable / candidate / nightly.
