# Contributing

Thanks for your interest in the Autonomyx Fast SaaS Toolkit.

## Development Setup

```bash
git clone https://github.com/openautonomyx/autonomyx-fast-saas-toolkit.git
cd autonomyx-fast-saas-toolkit
pnpm install
```

### Build

```bash
pnpm --filter @autonomyx/fast-saas build     # CLI
pnpm --filter @autonomyx/saas-middleware build # Middleware
```

### Test CLI locally

```bash
node packages/cli/dist/index.js catalog
node packages/cli/dist/index.js init test-project
```

### Validate Docker Compose

```bash
docker compose -f packages/starter/docker-compose.yml config --quiet
```

## Adding a New Module

1. Define the module in `packages/cli/src/modules/registry.ts`
2. Add compose environment in `packages/cli/src/generators/compose.ts`
3. Add a service README in `packages/starter/services/<name>/README.md`
4. Add a Prometheus scrape target in `packages/starter/services/prometheus/prometheus.yml`
5. Add a Caddy route if the service has a web UI
6. Rebuild CLI: `pnpm --filter @autonomyx/fast-saas build`
7. Add documentation in `docs/modules/`

## Pull Requests

- One feature per PR
- Update docs if you change behavior
- Run `pnpm --filter @autonomyx/fast-saas exec tsc --noEmit` before submitting
- Follow existing code patterns

## Commit Messages

```
feat: Add new module for X
fix: Correct health check for Y
docs: Update deployment guide
```
