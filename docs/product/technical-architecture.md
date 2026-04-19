# Technical Architecture: Productized Autonomyx Fast SaaS Toolkit

## 1) System Components

## A. Starter Runtime (customer-managed)
- Docker Compose stack generated from profile + module selection.
- Runtime APIs: SaaS API + optional AI/ops tools.
- Local metadata file (`.fast-saas.json`) + validated env schema.

## B. Hosted Control Plane (Autonomyx-managed)
- Tenant/org management for paid accounts.
- License issuance and entitlement service.
- Anonymous telemetry ingest + release notifications.
- Support ticket intake and incident workflow orchestration.

## C. CLI
- `init`: bootstrap project.
- `onboard`: guided first-run flow (domain, secrets, profile).
- `preflight`: environment and deploy readiness checks.
- `deploy`: target-aware deployments (local/VPS/Coolify).
- `doctor`: troubleshooting and self-healing recommendations.

## D. Dashboard
- Onboarding checklist + setup progress.
- Service/module health views.
- Tenant and plan management.
- Entitlement visibility.

## E. Docs Portal
- Versioned docs + role-based pathways.
- Embedded architecture diagrams and scenario runbooks.

## 2) Key Data Flows

### Flow A: First Run
1. User runs `fast-saas init`.
2. CLI writes scaffold + env template.
3. User runs `fast-saas onboard`.
4. Onboarding calls local validators.
5. Optional control-plane handshake activates license.
6. CLI writes final config, then runs deploy command.

### Flow B: Entitlement Enforcement
1. Module enable request occurs in CLI or dashboard.
2. Local policy evaluator checks offline cache.
3. If online, control plane validates edition + entitlements.
4. Allowed modules are enabled; blocked modules return upgrade CTA.

### Flow C: Health and Trust
1. Runtime publishes health snapshots.
2. Dashboard reads health API and displays status + remediation.
3. Optional telemetry posts anonymized diagnostics to control plane.

## 3) Configuration and Safety Standards

- Single source of truth: typed env schema package (e.g., Zod).
- Production-safe defaults:
  - No insecure local defaults when `DOMAIN != localhost`.
  - Required non-placeholder secrets before deploy.
  - Ports exposure minimized by default.
- Domain mapping manifest:
  - Stable mapping from module → subdomain.
  - Collision detection.

## 4) Deployment Model

### Local
- Full developer override support and readable logs.

### VPS
- Hardened compose mode (no dev overrides).
- Preflight checks for DNS, ports, memory, storage.

### Coolify
- Generated environment bundle + service dependency deployment order.

### Docker-first
- Primary path for v1.

### Kubernetes (future path)
- Deliver Helm charts + values profile parity after v1 GA.

## 5) Security and Compliance Baseline

- Secrets never committed; generated at bootstrap with strength checks.
- License tokens signed and short-lived for online verification.
- Audit trail for entitlement changes and admin actions (Pro+).
- CSP and secure cookie defaults for dashboard/control plane.

## 6) Proposed Package Topology (v1)

- `packages/config-schema`
- `packages/licensing`
- `packages/control-plane`
- `packages/docs-portal`
- `packages/web`
- `packages/onboarding`

