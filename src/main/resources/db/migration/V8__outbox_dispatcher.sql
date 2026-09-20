ALTER TABLE outbox_events ADD COLUMN processing_at TIMESTAMPTZ;
CREATE INDEX idx_outbox_processing ON outbox_events(status,processing_at);
