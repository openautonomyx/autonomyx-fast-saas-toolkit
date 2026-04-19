# v1 Release Checklist

## Product Readiness
- [ ] CE/Pro/Enterprise feature boundaries documented and enforced.
- [ ] First-run onboarding path completed end-to-end.
- [ ] “Default path” validated by new-user usability test (<=30 min to healthy stack).

## Engineering Readiness
- [ ] `fast-saas deploy` implemented and documented.
- [ ] Env schema validation shared across CLI/API/dashboard.
- [ ] Preflight checks cover Docker, DNS, resources, and secrets.
- [ ] Smoke tests pass on generated starter templates.
- [ ] Sample tenant/demo seed data available.

## Security & Reliability
- [ ] Production-safe defaults enabled when non-local domain detected.
- [ ] Secret placeholders blocked from deployment.
- [ ] Backup and restore runbook tested.
- [ ] Monitoring/alerts enabled in recommended profile.

## Docs & Adoption Assets
- [ ] Public docs portal published with quickstart journeys.
- [ ] Feature matrix added to website and docs.
- [ ] Architecture diagrams finalized.
- [ ] Case studies published.
- [ ] Quickstart video and transcript published.

## Commercial Operations
- [ ] Pricing page live.
- [ ] License key issuance flow active.
- [ ] Upgrade/downgrade handling tested.
- [ ] Support intake workflow (Pro/Enterprise) enabled.

## Launch Execution
- [ ] Release notes complete.
- [ ] Dry-run deploy completed from clean machine.
- [ ] Incident owner + rollback plan assigned.
- [ ] Launch day checklist owner assigned per function.

