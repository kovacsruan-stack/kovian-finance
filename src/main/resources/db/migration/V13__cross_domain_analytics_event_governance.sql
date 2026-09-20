CREATE TABLE IF NOT EXISTS kovian_analytics_event (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    subject_id VARCHAR(200) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    source VARCHAR(80) NOT NULL,
    schema_version VARCHAR(32) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    purpose VARCHAR(120) NOT NULL,
    payload JSONB NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_kovian_analytics_event_tenant_occurred
    ON kovian_analytics_event (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_kovian_analytics_event_subject_occurred
    ON kovian_analytics_event (tenant_id, subject_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_kovian_analytics_event_type_occurred
    ON kovian_analytics_event (tenant_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_kovian_analytics_event_deletion
    ON kovian_analytics_event (deleted_at)
    WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE kovian_analytics_event IS 'Governed cross-domain analytics events. Domain facts remain owned by their source systems.';
