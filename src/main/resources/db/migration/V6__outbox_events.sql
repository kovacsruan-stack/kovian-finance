CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    aggregate_type VARCHAR(80) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    last_error VARCHAR(1000),
    CONSTRAINT ck_outbox_status CHECK (status IN ('PENDING','PROCESSING','PUBLISHED','FAILED'))
);
CREATE INDEX idx_outbox_pending ON outbox_events(status, available_at, created_at);
CREATE INDEX idx_outbox_owner_created ON outbox_events(owner_id, created_at DESC);
CREATE INDEX idx_outbox_aggregate ON outbox_events(aggregate_type, aggregate_id);