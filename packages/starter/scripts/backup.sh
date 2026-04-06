#!/usr/bin/env bash
set -euo pipefail

# Autonomyx Fast SaaS Toolkit — Database Backup
# Dumps all service databases to timestamped files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

POSTGRES_USER="${POSTGRES_USER:-saas}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "💾 Backing up databases to $BACKUP_DIR..."

DATABASES=(saas logto lago glitchtip nocodb n8n docmost mautic)

for db in "${DATABASES[@]}"; do
  FILE="$BACKUP_DIR/${db}_${TIMESTAMP}.sql.gz"
  if docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$db" 2>/dev/null | gzip > "$FILE"; then
    SIZE=$(du -h "$FILE" | cut -f1)
    echo "  ✓ $db → $FILE ($SIZE)"
  else
    echo "  ✗ $db (skipped — database may not exist)"
    rm -f "$FILE"
  fi
done

echo ""
echo "✅ Backup complete!"
