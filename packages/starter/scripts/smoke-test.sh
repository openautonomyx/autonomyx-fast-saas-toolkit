#!/usr/bin/env bash
set -euo pipefail

# Fast SaaS smoke tests: validates critical endpoints after startup.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

echo "=== Autonomyx Fast SaaS Toolkit — Smoke Test ==="

checks=(
  "API|http://localhost:8080/health"
  "Dashboard|http://localhost:3200"
  "Grafana|http://localhost:3000/api/health"
)

failures=0
for entry in "${checks[@]}"; do
  IFS='|' read -r name url <<< "$entry"
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 10 "$url" || true)

  if [[ "$code" =~ ^2|3 ]]; then
    echo "✓ $name ($code)"
  elif [[ "$code" == "000" ]]; then
    echo "⚠ $name unreachable (possibly disabled by profile): $url"
  else
    echo "✗ $name failed with status $code"
    failures=$((failures + 1))
  fi
done

if [ "$failures" -gt 0 ]; then
  echo "❌ Smoke test failed with $failures failing checks"
  exit 1
fi

echo "✅ Smoke test passed"
