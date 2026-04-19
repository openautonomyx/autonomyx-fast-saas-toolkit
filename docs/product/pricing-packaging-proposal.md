# Pricing and Packaging Proposal

## Packaging Tiers

## Community Edition (CE) — Free

**For:** developers and early MVPs.  
**Includes:**
- Core CLI init flow.
- Essential/core/ops local stack.
- Basic docs and templates.
- Community support.

**Limits:**
- No advanced preflight suite.
- No hosted control plane features.
- No premium growth/enterprise module unlocks.

## Pro — $149/month per workspace (starting)

**For:** startups shipping production workloads.  
**Includes CE +**
- Advanced preflight checks (DNS, TLS, secrets, resources).
- Guided onboarding wizard in dashboard + CLI.
- Premium deployment helper flows (VPS/Coolify assist).
- Expanded health diagnostics and alert templates.
- Email support (business hours).

## Enterprise — Custom pricing (from $2,000/month)

**For:** regulated or larger organizations.  
**Includes Pro +**
- SSO/SAML, SCIM, audit exports.
- Enterprise policy controls + private modules.
- Dedicated onboarding support and migration assistance.
- SLA-backed support and escalation workflow.
- Security review and architectural advisory.

## Feature Matrix (Public-facing)

| Capability | Community | Pro | Enterprise |
|---|---:|---:|---:|
| One-command bootstrap | ✅ | ✅ | ✅ |
| Core profiles | ✅ | ✅ | ✅ |
| Advanced preflight suite | — | ✅ | ✅ |
| Guided onboarding UI | — | ✅ | ✅ |
| License/entitlement management | — | ✅ | ✅ |
| Hosted control plane | — | ✅ | ✅ |
| SSO/SAML/SCIM | — | — | ✅ |
| SLA support | — | — | ✅ |

## Monetization Hooks (Implementation)

1. **Entitlements API** in control plane.
2. **Policy middleware** in CLI/dashboard/module enable paths.
3. **Grace period and downgrade rules** (e.g., 14 days).
4. **Support plan tagging** surfaced in dashboard.

## GTM Packaging Notes

- Keep CE generous enough for trust and adoption.
- Pro must be the default commercial landing recommendation.
- Enterprise should emphasize security, governance, and uptime partnership.

