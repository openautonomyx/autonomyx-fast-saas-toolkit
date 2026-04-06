-- Usage tracking for metered billing via Lago
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioned index for time-series queries
CREATE INDEX idx_usage_events_tenant_time ON usage_events(tenant_id, timestamp DESC);
CREATE INDEX idx_usage_events_type ON usage_events(event_type, timestamp DESC);

-- Aggregated usage view for dashboard queries
CREATE OR REPLACE VIEW usage_summary AS
SELECT
    tenant_id,
    event_type,
    DATE_TRUNC('day', timestamp) AS day,
    COUNT(*) AS count
FROM usage_events
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY tenant_id, event_type, DATE_TRUNC('day', timestamp);
