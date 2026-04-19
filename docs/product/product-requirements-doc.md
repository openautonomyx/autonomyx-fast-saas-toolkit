# Product Requirements Doc (PRD)

## Product

**Name:** Autonomyx Fast SaaS Toolkit  
**Version Target:** v1.0  
**Positioning:** The fastest path for founders and engineering teams to launch a production-ready multi-tenant SaaS stack with optional AI and ops modules.

## Problem Statement

Users can assemble infrastructure with the current toolkit, but they still face high onboarding complexity, unclear edition boundaries, and no polished commercial journey from discovery to deployment.

## Target Users

1. **Technical founder** launching MVP in <14 days.
2. **Startup engineering team** replacing bespoke platform setup.
3. **Agency / systems integrator** shipping repeatable SaaS builds for clients.
4. **Enterprise innovation team** requiring self-host + support SLAs.

## Product Goals (v1)

1. **Time-to-first-running-stack < 30 minutes** for new users.
2. **Time-to-first-tenant < 60 minutes** including auth, billing, and health checks.
3. **Single default path** that works without deep infra knowledge.
4. **Commercial readiness** with CE/Pro/Enterprise packaging and entitlement hooks.

## Non-Goals (v1)

- Full Kubernetes operator.
- Multi-region HA automation.
- Marketplace-level plugin ecosystem.

## Core Product Architecture (User-facing)

1. **Starter Kit (self-hosted runtime)**
2. **Hosted Control Plane (licensing, updates, support, telemetry)**
3. **CLI (bootstrap + preflight + deploy)**
4. **Admin Dashboard (operations + onboarding + health)**
5. **Docs Site (task-driven, role-based journeys)**

## Functional Requirements

### FR1: First-run onboarding wizard
- Must guide domain, secrets, module profile, and deployment target.
- Must generate validated config before any deployment action.
- Must produce a human-readable summary and next-step commands.

### FR2: Environment validation
- Must validate required env keys and secret strength.
- Must verify domain DNS readiness.
- Must verify local Docker health and minimum resource availability.

### FR3: Opinionated module profiles
- Provide default presets:
  - **Launch Fast:** essential + core + ops
  - **Growth Ready:** launch fast + growth essentials
  - **AI Ready:** growth ready + AI observability baseline

### FR4: Health dashboard
- Central health status by service/group.
- Actionable remediation links per failed check.
- Include startup progress (bootstrapping step tracker).

### FR5: Docs portal and guided journeys
- “Start here” path by persona.
- Copy-paste command blocks with expected output.
- Troubleshooting decision trees.

### FR6: Monetization hooks
- Entitlement checks at module-enable time and API-use time.
- Graceful downgrade/expired license handling.
- Support entitlement badge and escalation workflow entry points.

## Packaging Strategy Requirements

### Community Edition
- Core starter flow, local deployment, basic docs.
- No hosted control plane automations.

### Pro
- Production preflight suite, advanced dashboards, deploy helpers, premium module unlocks.

### Enterprise
- SSO/SCIM, policy controls, audit logs, support SLA workflows, private onboarding support.

## UX Requirements (Ruthless Simplicity)

1. Default path must ask **at most 5 decisions** before first deploy.
2. Every advanced option hidden behind “Advanced settings”.
3. Never block on optional integrations for first success.
4. Every error must include “what failed”, “why”, and “exact fix command”.

## Success Metrics

- Activation: % of users completing bootstrap + health pass.
- Time-to-value: median time from `init` to first healthy stack.
- Retention: % projects returning in 7/30 days.
- Revenue: Pro conversion from CE within 30 days.

