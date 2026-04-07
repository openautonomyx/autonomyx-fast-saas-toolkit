# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Langfuse LLM observability (AI profile) -- traces, evaluations, prompt management, cost tracking
- AI API routes (14 endpoints) at `/api/v1/ai/` -- Ollama, Langflow, Claude Agent, Langfuse proxies
- AI MCP tools (14 tools) -- `fast_saas_ollama_*`, `fast_saas_langflow_*`, `fast_saas_claude_*`
- Open SMTP configuration -- provider-agnostic (Stalwart, SendGrid, Mailgun, AWS SES, Gmail)
- SMTP integration for LibreChat and Langfuse

## [0.1.1] - 2026-04-06

### Added
- Next-gen AI layer with new `ai` profile group
  - LibreChat (multi-model AI chat with MongoDB + Meilisearch sidecars)
  - Langflow (visual LLM workflow builder)
  - Ollama (local LLM runtime with GPU passthrough option)
  - Claude Agent (containerized Claude Code runner with HTTP API)
- REST API server (`@autonomyx/api`) with 24 endpoints
  - Tenant, user, membership, API key, usage, plan, admin routes
  - JWT auth via Logto JWKS + platform API keys (pk_ prefix)
- MCP server (`@autonomyx/mcp-fast-saas`) with 30 tools
  - Full CRUD for tenants, users, members, API keys
  - Convenience tools: tenant overview, suspend/reactivate, usage limit check, key rotation

### Fixed
- Logto first-run: setup.sh auto-seeds database
- RustFS health check: accepts 403 as alive
- Logto port conflict with Uptime Kuma (changed to 3301/3302)
- Logto health check uses wget (curl not in image)

## [0.1.0] - 2026-04-06

### Added
- Initial release
- Docker Compose stack with 17 services across 4 profiles (essential/core/ops/growth)
- CLI scaffolding tool (`@autonomyx/fast-saas`) with 9 commands
- Multi-tenancy TypeScript middleware (auth-guard, tenant-context, rate-limiter, usage-tracker, feature-flags, health)
- SQL migrations (tenants, users, memberships, api_keys, usage_events)
- Claude Code skill (`/fast-saas-toolkit`) with 5 modes (scaffold/configure/convert/deploy/diagnose)
- 4 Grafana dashboards (SaaS overview, tenant usage, infrastructure, billing)
- 10 Prometheus alert rules
- 6 pre-built n8n workflows (welcome email, usage alert, error alert, backup, billing sync, onboarding)
- 15 documentation files (quick start, architecture, CLI reference, module guides, deployment, security, troubleshooting)
- 3 business templates (launch checklist, pricing page, investor metrics)
- GitHub Actions CI/CD with npm publish on tag
- Per-service READMEs with setup guides

[Unreleased]: https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/releases/tag/v0.1.0
