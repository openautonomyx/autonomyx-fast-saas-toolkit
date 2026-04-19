#!/usr/bin/env bash
set -euo pipefail

# One-command bootstrap: preflight -> up -> setup -> health -> smoke test

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$SCRIPT_DIR/preflight.sh"
docker compose --profile essential --profile core --profile ops up -d
"$SCRIPT_DIR/setup.sh"
"$SCRIPT_DIR/health-check.sh"
"$SCRIPT_DIR/smoke-test.sh"

echo "✅ Bootstrap complete"
