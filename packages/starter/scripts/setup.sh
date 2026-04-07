#!/usr/bin/env bash
set -euo pipefail

# Autonomyx Fast SaaS Toolkit — First-time Setup
# Creates per-service databases in PostgreSQL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

POSTGRES_USER="${POSTGRES_USER:-saas}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo "=== Autonomyx Fast SaaS Toolkit — Setup ==="
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
    echo "✓ PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "✗ PostgreSQL did not become ready in 30 seconds"
    exit 1
  fi
  sleep 1
done

# Create per-service databases (migrations for 'saas' DB are auto-applied via docker-entrypoint-initdb.d)
echo ""
echo "📦 Creating service databases..."

DATABASES=(logto lago glitchtip nocodb n8n docmost mautic langflow)

for db in "${DATABASES[@]}"; do
  if docker compose exec -T postgres psql -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$db"; then
    echo "  ✓ $db (already exists)"
  else
    docker compose exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db;" >/dev/null 2>&1
    echo "  ✓ $db (created)"
  fi
done

# Seed Logto database on first run
echo ""
echo "🔑 Initializing Logto auth database..."
if docker compose exec -T postgres psql -U "$POSTGRES_USER" -d logto -c "SELECT 1 FROM _logto_config LIMIT 1;" >/dev/null 2>&1; then
  echo "  ✓ Logto (already seeded)"
else
  echo "  ⏳ Running Logto seed (first-time only, may take 30s)..."
  docker compose run --rm --entrypoint sh logto -c "npx @logto/cli db seed --swe && npx @logto/cli db alteration deploy" 2>&1 | grep -E "^(info|fatal)" || true
  echo "  ✓ Logto seed complete"
fi

echo ""
echo "✅ Setup complete! Run 'make up' to start services."
