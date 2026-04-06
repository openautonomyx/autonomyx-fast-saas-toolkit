#!/usr/bin/env bash
set -euo pipefail

# Autonomyx Fast SaaS Toolkit — Health Check
# Checks all running services and prints a status table

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

DOMAIN="${DOMAIN:-localhost}"

# Service definitions: name|url|profile
SERVICES=(
  "PostgreSQL|localhost:${POSTGRES_PORT:-5432}|essential"
  "Redis|localhost:${REDIS_PORT:-6379}|essential"
  "Caddy|http://localhost:80|essential"
  "Logto|http://localhost:${LOGTO_PORT:-3001}/api/status|core"
  "Lago API|http://localhost:3000/health|core"
  "RustFS|http://localhost:${RUSTFS_API_PORT:-9000}/minio/health/live|core"
  "GlitchTip|http://localhost:8000/_health/|ops"
  "Uptime Kuma|http://localhost:3001|ops"
  "Prometheus|http://localhost:9090/-/healthy|ops"
  "Loki|http://localhost:3100/ready|ops"
  "Grafana|http://localhost:3000/api/health|ops"
  "Matomo|http://localhost:8080|growth"
  "Mautic|http://localhost:80/s/login|growth"
  "NocoDB|http://localhost:8080/api/v1/health|growth"
  "n8n|http://localhost:5678/healthz|growth"
)

printf "\n%-20s %-10s %-10s %s\n" "SERVICE" "STATUS" "TIME" "PROFILE"
printf "%-20s %-10s %-10s %s\n" "-------" "------" "----" "-------"

for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name url profile <<< "$entry"

  # Check if service container is running
  start_time=$(python3 -c "import time; print(int(time.time()*1000))" 2>/dev/null || echo "0")

  if [[ "$name" == "PostgreSQL" ]]; then
    if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-saas}" >/dev/null 2>&1; then
      status="✓ UP"
    else
      status="✗ DOWN"
    fi
  elif [[ "$name" == "Redis" ]]; then
    if docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-}" ping >/dev/null 2>&1; then
      status="✓ UP"
    else
      status="✗ DOWN"
    fi
  else
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 5 "$url" 2>/dev/null || echo "000")
    if [[ "$http_code" =~ ^[23] ]]; then
      status="✓ UP"
    elif [[ "$http_code" == "000" ]]; then
      status="- SKIP"
    else
      status="✗ $http_code"
    fi
  fi

  end_time=$(python3 -c "import time; print(int(time.time()*1000))" 2>/dev/null || echo "0")
  latency="$((end_time - start_time))ms"

  printf "%-20s %-10s %-10s %s\n" "$name" "$status" "$latency" "$profile"
done

echo ""
