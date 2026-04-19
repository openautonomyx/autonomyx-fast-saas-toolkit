#!/usr/bin/env bash
set -euo pipefail

# Fast SaaS preflight checks for first-time production users.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

fail() {
  echo "✗ $1"
  exit 1
}

warn() {
  echo "⚠ $1"
}

ok() {
  echo "✓ $1"
}

echo "=== Autonomyx Fast SaaS Toolkit — Preflight ==="

command -v docker >/dev/null 2>&1 || fail "Docker is not installed"
command -v curl >/dev/null 2>&1 || fail "curl is not installed"

if ! docker info >/dev/null 2>&1; then
  fail "Docker daemon is not running"
fi
ok "Docker is running"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
  fail ".env file not found. Copy .env.example to .env first"
fi
ok ".env found"

if grep -q "CHANGE_ME" "$PROJECT_ROOT/.env"; then
  warn "Detected CHANGE_ME placeholders in .env"
fi

required=(DOMAIN ADMIN_EMAIL POSTGRES_PASSWORD REDIS_PASSWORD)
for key in "${required[@]}"; do
  if ! grep -Eq "^${key}=.+" "$PROJECT_ROOT/.env"; then
    fail "Missing required env var: $key"
  fi
done
ok "Required env vars are present"

ports=(80 443 5432 6379)
for port in "${ports[@]}"; do
  if command -v ss >/dev/null 2>&1 && ss -ltn | awk '{print $4}' | grep -q ":${port}$"; then
    warn "Port ${port} appears in use"
  fi
done
ok "Port scan completed"

echo "✅ Preflight completed"
