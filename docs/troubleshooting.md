# Troubleshooting

## Quick Diagnosis

```bash
# Check what's running
make ps

# Check health of all services
make health

# Tail logs for a specific service
make logs-logto
make logs-lago-api
```

Or use the Claude skill:
```
/fast-saas-toolkit
> diagnose my stack
```

## Common Issues

### Service won't start

**Symptom:** Container keeps restarting or exits immediately.

**Check:**
```bash
docker compose logs --tail=50 SERVICE_NAME
```

**Common causes:**
- Missing environment variable → check `.env` for `CHANGE_ME` placeholders
- Database not created → run `./scripts/setup.sh`
- Port conflict → another service using the same port
- Insufficient memory → check `docker stats --no-stream`

### Logto returns 502

**Cause:** Database not initialized.

**Fix:**
```bash
./scripts/setup.sh
docker compose restart logto
```

### Lago health check fails

**Cause:** Missing encryption keys.

**Fix:** Verify all `LAGO_*` variables in `.env` are set (not `CHANGE_ME`):
```bash
grep LAGO_ .env
```

### GlitchTip returns 500

**Cause:** Redis connection failed.

**Fix:** Verify `REDIS_PASSWORD` in `.env` matches what Redis is using:
```bash
docker compose exec redis redis-cli -a YOUR_REDIS_PASSWORD ping
# Should return: PONG
```

### Caddy certificate errors

**Cause:** DNS not configured or ports blocked.

**Fix:**
1. Verify DNS: `dig auth.DOMAIN` should return your server IP
2. Verify ports 80 and 443 are open: `curl -I http://YOUR_IP`
3. Check Caddy logs: `docker compose logs caddy`

### n8n can't connect to database

**Cause:** `n8n` database doesn't exist.

**Fix:**
```bash
docker compose exec postgres psql -U saas -c "CREATE DATABASE n8n;"
docker compose restart n8n
```

### Matomo stuck on install screen

**Cause:** MariaDB not ready yet.

**Fix:** Wait 30 seconds and refresh. If still stuck:
```bash
docker compose logs matomo-db
# Look for "ready for connections"
docker compose restart matomo
```

### High memory usage

**Cause:** Too many growth modules enabled.

**Fix:** Disable unused modules:
```bash
# Edit .env
COMPOSE_PROFILES=essential,core,ops
# Remove 'growth' or specific modules

# Restart
make down && make up
```

### Services can't reach each other

**Cause:** Network misconfiguration.

**Fix:**
```bash
# Verify all services are on the same network
docker network inspect autonomyx-fast-saas-toolkit_saas-internal

# Verify DNS resolution
docker compose exec logto ping postgres
```

## Resource Requirements

If services are slow or crashing, check if your server meets minimums:

| Profile | Min RAM | Recommended |
|---|---|---|
| essential + core | 2 GB | 4 GB |
| + ops | 4 GB | 6 GB |
| + all growth | 6 GB | 8 GB |

Check current usage:
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## Getting Help

1. Check service-specific docs in `services/<name>/README.md`
2. Use the Claude skill: `/fast-saas-toolkit` → diagnose mode
3. Check the [GitHub issues](https://github.com/openautonomyx/autonomyx-fast-saas-toolkit/issues)
