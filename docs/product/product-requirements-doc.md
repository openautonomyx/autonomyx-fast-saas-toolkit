# Product Requirements Doc (PRD)
## Product: Autonomyx Fast SaaS Toolkit

## 1) Product Vision
Autonomyx Fast SaaS Toolkit is the fastest path from idea to production SaaS: one guided setup flow, production-safe defaults, and optional advanced modules that can be enabled progressively.

**Core UX principle:** new users should reach a working SaaS in under 30 minutes with a single command path.

## 2) Target Users
- **Primary:** indie founders, product engineers, startup CTOs.
- **Secondary:** agencies and internal platform teams shipping repeated SaaS patterns.
- **Tertiary:** enterprises needing private deployment and support SLAs.

## 3) Problem Statement
Current repo value is high, but the user journey is “toolkit-first” (many knobs, many modules). Commercial product needs “outcome-first” onboarding with opinionated defaults.

## 4) Product Outcomes (v1)
- Time-to-first-running-stack: **<= 30 minutes** on local Docker.
- Time-to-first-production-deploy: **<= 1 day** on VPS/Coolify.
- First-run setup success rate: **>= 85%**.
- New user activation (completes onboarding + smoke test): **>= 60%**.

## 5) Scope
### In Scope (v1)
- Starter kit + hosted control plane architecture.
- Packaging (Community / Pro / Enterprise).
- Landing page and docs portal structure.
- Guided onboarding wizard (CLI-first, dashboard-supported).
- Environment schema validation + preflight + smoke tests.
- Deployment hardening guides (local, VPS, Coolify, Docker).
- Monetization hooks (license gating + support workflows).

### Out of Scope (v1)
- Full Kubernetes operator (define migration path only).
- Complex multi-region control plane.
- Deep vendor-specific lock-in features.

## 6) Product Surface
- **Starter Kit:** self-hostable stack with modules and profiles.
- **Hosted Control Plane:** licensing, updates, telemetry opt-in, billing/support portal.
- **CLI:** bootstrap, doctor/preflight, env validation, deploy helpers.
- **Admin Dashboard:** onboarding wizard, module management, health overview.
- **Docs Site:** setup paths by persona, deployment recipes, troubleshooting.

## 7) Functional Requirements
1. One-command bootstrap (`fast-saas bootstrap`) with opinionated defaults.
2. Preflight checks before startup (Docker, ports, env, domain, memory).
3. Strong env validation with clear actionable errors.
4. Onboarding flow with module profile presets:
   - `minimal` (essential+core)
   - `standard` (+ops)
   - `growth` (+growth)
   - `ai` (+ai)
5. Health dashboard summarizing critical service status and tenant readiness.
6. Smoke test workflow validating API auth, tenant CRUD, billing hooks.
7. Licensing gate for premium modules/features.
8. Documentation path tailored to “first deployment in one day”.

## 8) Non-Functional Requirements
- Secure defaults (no weak secrets, no default production creds).
- Reproducible deployments.
- Backwards-compatible upgrade path for CLI and compose assets.
- Observability-by-default for core services.

## 9) Success Metrics
- Bootstrap completion rate.
- Mean time to recover from setup failure.
- Doc-to-activation conversion.
- Paid conversion by edition.

## 10) Risks and Mitigations
- **Risk:** too many optional modules overwhelm users.
  - **Mitigation:** preset profiles + progressive disclosure.
- **Risk:** self-hosting support burden.
  - **Mitigation:** runbooks + hosted support tiers + enterprise onboarding package.
- **Risk:** secret misconfiguration.
  - **Mitigation:** stricter env schema and preflight blocking for unsafe values.
