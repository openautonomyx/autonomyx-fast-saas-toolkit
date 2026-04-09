#!/bin/sh
# dashboard-init bootstrap script
# ================================================================
# Runs once on first `docker compose up`. Registers an OIDC client
# in Logto's Management API so the dashboard can authenticate users.
#
# Idempotent: if the client already exists (on subsequent boots),
# we detect it and skip creation.
#
# Writes the client ID + secret to /bootstrap/logto-app-credentials.env
# which docker-compose mounts read-only into the dashboard container.
# The dashboard's entrypoint sources this file before starting Next.js.
#
# Required env vars:
#   LOGTO_ENDPOINT          — e.g. http://logto:3001 (internal)
#   LOGTO_ADMIN_USER        — Logto admin username
#   LOGTO_ADMIN_PASSWORD    — Logto admin password
#   DOMAIN                  — public domain, used for redirect URIs

set -eu

BOOTSTRAP_FILE="/bootstrap/logto-app-credentials.env"
CLIENT_NAME="Autonomyx Dashboard"
DASHBOARD_URL="https://app.${DOMAIN}"

echo "[dashboard-init] Starting Logto OIDC client registration"
echo "[dashboard-init] Logto endpoint: ${LOGTO_ENDPOINT}"
echo "[dashboard-init] Dashboard URL:  ${DASHBOARD_URL}"

# ── Idempotency check ────────────────────────────────────────────
if [ -s "${BOOTSTRAP_FILE}" ]; then
    echo "[dashboard-init] Credentials file already exists. Verifying..."
    # shellcheck disable=SC1090
    . "${BOOTSTRAP_FILE}"
    if [ -n "${LOGTO_APP_ID:-}" ] && [ -n "${LOGTO_APP_SECRET:-}" ]; then
        echo "[dashboard-init] Existing credentials look valid. Skipping bootstrap."
        exit 0
    fi
    echo "[dashboard-init] File exists but incomplete. Re-bootstrapping."
fi

# ── Wait for Logto to be fully ready ─────────────────────────────
echo "[dashboard-init] Waiting for Logto to be reachable..."
retry=0
max_retries=60
until curl -fsS "${LOGTO_ENDPOINT}/api/status" >/dev/null 2>&1; do
    retry=$((retry + 1))
    if [ "${retry}" -ge "${max_retries}" ]; then
        echo "[dashboard-init] ERROR: Logto not reachable after ${max_retries} attempts"
        exit 1
    fi
    sleep 2
done
echo "[dashboard-init] Logto is reachable"

# ── Authenticate to Logto Management API ─────────────────────────
# Logto exposes its own Management API with the same OIDC server.
# We use the machine-to-machine flow to get an access token.
echo "[dashboard-init] Fetching Management API access token"
TOKEN_RESPONSE=$(curl -fsS -X POST "${LOGTO_ENDPOINT}/oidc/token" \
    -u "${LOGTO_ADMIN_USER}:${LOGTO_ADMIN_PASSWORD}" \
    -d "grant_type=client_credentials" \
    -d "resource=https://default.logto.app/api" \
    -d "scope=all")

ACCESS_TOKEN=$(echo "${TOKEN_RESPONSE}" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "${ACCESS_TOKEN}" ]; then
    echo "[dashboard-init] ERROR: Failed to obtain access token"
    echo "[dashboard-init] Response: ${TOKEN_RESPONSE}"
    exit 1
fi
echo "[dashboard-init] Got management access token"

# ── Check if the dashboard OIDC app already exists ───────────────
echo "[dashboard-init] Checking for existing OIDC app named '${CLIENT_NAME}'"
EXISTING=$(curl -fsS "${LOGTO_ENDPOINT}/api/applications" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

# Parse for a matching name. Using sed because we don't have jq in the
# curlimages/curl image. This is brittle but sufficient for our single-name check.
EXISTING_ID=$(echo "${EXISTING}" | sed -n 's/.*"id":"\([^"]*\)"[^}]*"name":"'"${CLIENT_NAME}"'".*/\1/p' | head -1)

if [ -n "${EXISTING_ID}" ]; then
    echo "[dashboard-init] OIDC app already exists with ID: ${EXISTING_ID}"
    echo "[dashboard-init] Fetching secret..."
    APP_DETAIL=$(curl -fsS "${LOGTO_ENDPOINT}/api/applications/${EXISTING_ID}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
    APP_ID="${EXISTING_ID}"
    APP_SECRET=$(echo "${APP_DETAIL}" | sed -n 's/.*"secret":"\([^"]*\)".*/\1/p')
else
    # ── Create the OIDC app ──────────────────────────────────────
    echo "[dashboard-init] Creating new OIDC app"
    CREATE_BODY=$(cat <<JSON
{
    "name": "${CLIENT_NAME}",
    "type": "Traditional",
    "description": "Auto-registered by dashboard-init bootstrap for the Fast SaaS Toolkit command center",
    "oidcClientMetadata": {
        "redirectUris": ["${DASHBOARD_URL}/api/logto/sign-in-callback"],
        "postLogoutRedirectUris": ["${DASHBOARD_URL}/login"]
    }
}
JSON
)
    CREATE_RESPONSE=$(curl -fsS -X POST "${LOGTO_ENDPOINT}/api/applications" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${CREATE_BODY}")

    APP_ID=$(echo "${CREATE_RESPONSE}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
    APP_SECRET=$(echo "${CREATE_RESPONSE}" | sed -n 's/.*"secret":"\([^"]*\)".*/\1/p')
fi

if [ -z "${APP_ID}" ] || [ -z "${APP_SECRET}" ]; then
    echo "[dashboard-init] ERROR: Failed to obtain APP_ID or APP_SECRET"
    exit 1
fi

# ── Write credentials to shared volume ───────────────────────────
umask 077
cat > "${BOOTSTRAP_FILE}" <<EOF
LOGTO_APP_ID=${APP_ID}
LOGTO_APP_SECRET=${APP_SECRET}
EOF

echo "[dashboard-init] Credentials written to ${BOOTSTRAP_FILE}"
echo "[dashboard-init] LOGTO_APP_ID=${APP_ID}"
echo "[dashboard-init] Bootstrap complete"
