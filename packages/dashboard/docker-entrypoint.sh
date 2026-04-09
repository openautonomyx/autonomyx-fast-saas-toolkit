#!/bin/sh
# Dashboard container entrypoint.
# Sources /bootstrap/logto-app-credentials.env (populated by the
# dashboard-init sidecar on first boot) to pick up the Logto OIDC
# client credentials, then execs whatever CMD the container was
# started with (normally `node server.js`).
#
# Falls through gracefully if the bootstrap file is missing or empty —
# the Next.js app will throw a clear "missing env var" error on startup
# and the Docker log will tell you which var wasn't set.

set -e

BOOTSTRAP_FILE="/bootstrap/logto-app-credentials.env"

if [ -s "${BOOTSTRAP_FILE}" ]; then
    echo "[dashboard-entrypoint] Sourcing ${BOOTSTRAP_FILE}"
    # shellcheck disable=SC1090
    . "${BOOTSTRAP_FILE}"
    export LOGTO_APP_ID LOGTO_APP_SECRET
    echo "[dashboard-entrypoint] LOGTO_APP_ID=${LOGTO_APP_ID}"
else
    echo "[dashboard-entrypoint] No bootstrap file at ${BOOTSTRAP_FILE} — relying on environment variables"
fi

exec "$@"
