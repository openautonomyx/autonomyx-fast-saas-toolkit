#!/usr/bin/env bash
set -euo pipefail

# Autonomyx Fast SaaS Toolkit — Seed Data
# Creates sample tenant and user for development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

POSTGRES_USER="${POSTGRES_USER:-saas}"

echo "🌱 Seeding development data..."

docker compose exec -T postgres psql -U "$POSTGRES_USER" -d saas <<'SQL'
-- Sample tenant
INSERT INTO tenants (id, name, slug, plan, status, settings)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Acme Corp',
  'acme',
  'pro',
  'active',
  '{"theme": "dark", "timezone": "America/New_York"}'
)
ON CONFLICT (slug) DO NOTHING;

-- Sample user
INSERT INTO users (id, email, name, email_verified)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'admin@acme.example',
  'Admin User',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Link user to tenant as owner
INSERT INTO tenant_memberships (tenant_id, user_id, role)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'owner'
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

SELECT 'Seeded: ' || COUNT(*) || ' tenant(s), ' ||
       (SELECT COUNT(*) FROM users) || ' user(s), ' ||
       (SELECT COUNT(*) FROM tenant_memberships) || ' membership(s)'
FROM tenants;
SQL

echo "✅ Seed complete!"
