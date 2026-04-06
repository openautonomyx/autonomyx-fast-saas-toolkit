# CLI Reference

The `@autonomyx/fast-saas` CLI scaffolds and manages SaaS projects.

## Installation

```bash
npm install -g @autonomyx/fast-saas
```

## Commands

### `fast-saas init [name]`

Scaffold a new SaaS project interactively.

```bash
fast-saas init my-saas
```

**Prompts:**
1. Project name (if not provided as argument)
2. Domain (e.g., `myapp.com` or `localhost`)
3. Admin email
4. Core modules (Logto, Lago, RustFS — default on)
5. Ops modules (GlitchTip, Uptime Kuma, Grafana — default on)
6. Growth modules (opt-in individually)

**Generated files:**
- `docker-compose.yml` — All selected services with profiles
- `.env` — Environment variables with auto-generated secrets
- `.env.example` — Template without real secrets
- `Caddyfile` — Reverse proxy routes for selected modules
- `Makefile` — Lifecycle commands
- `.fast-saas.json` — Project manifest (used by add/remove)
- `migrations/` — PostgreSQL schema (tenants, users, etc.)
- `scripts/` — setup, seed, backup, health-check
- `services/` — Per-service config directories
- `n8n-workflows/` — Pre-built automation templates
- `grafana-dashboards/` — Pre-built dashboard JSON

### `fast-saas catalog`

List all available modules with descriptions, dependencies, and subdomain routes.

```bash
fast-saas catalog
```

### `fast-saas add <module>`

Add a module to an existing project. Must be run from a project directory (contains `.fast-saas.json`).

```bash
fast-saas add matomo
fast-saas add n8n
fast-saas add stalwart
```

Auto-resolves dependencies (e.g., adding `mautic` also adds `postgres` if missing).

Regenerates `docker-compose.yml`, `.env`, and `Caddyfile`.

### `fast-saas remove <module>`

Remove a module from the current project. Checks for dependents before removing.

```bash
fast-saas remove matomo
```

Will refuse if other modules depend on the one being removed. Data volumes are preserved.

### `fast-saas up [--detach]`

Start all enabled services using the profiles from `.env`.

```bash
fast-saas up           # Foreground (logs in terminal)
fast-saas up --detach  # Background (detached)
```

Equivalent to `docker compose --profile essential --profile core --profile ops up [-d]`.

### `fast-saas down`

Stop all running services. Data volumes are preserved.

```bash
fast-saas down
```

### `fast-saas health`

Check the health status of all running services. Displays a table with service name, status, response time, and URL.

```bash
fast-saas health
```

Example output:
```
SERVICE              STATUS     TIME       URL
Logto                ✓ UP       45ms       http://localhost:3001
Lago API             ✓ UP       120ms      http://localhost:3000
RustFS               ✓ UP       30ms       http://localhost:9000
GlitchTip            ✓ UP       200ms      http://localhost:8000
Uptime Kuma          ✓ UP       50ms       http://localhost:3001
Grafana              ✓ UP       80ms       http://localhost:3000
```

### `fast-saas env [--regenerate]`

Validate that all required environment variables are set and not placeholder values.

```bash
fast-saas env               # Check for issues
fast-saas env --regenerate  # Regenerate all secrets
```

Reports:
- Missing required variables
- Variables still set to `CHANGE_ME`
- Domain set to `example.com`

## Makefile Commands

When inside a generated project, `make` commands are also available:

| Command | Description |
|---|---|
| `make up` | Start essential + core + ops |
| `make up-all` | Start everything including growth |
| `make down` | Stop all services |
| `make restart` | Stop and start |
| `make destroy` | Stop and delete all data volumes |
| `make health` | Run health check script |
| `make ps` | Show running services |
| `make logs` | Tail all service logs |
| `make logs-logto` | Tail logs for specific service |
| `make setup` | Create service databases |
| `make seed` | Insert sample data |
| `make backup` | Backup all databases |
