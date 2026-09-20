ALTER TABLE financial_accounts ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE credit_card_invoices ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE debts ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE recurring_transactions ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    actor_id UUID,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID,
    metadata TEXT,
    correlation_id VARCHAR(120),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_events_owner_time ON audit_events(owner_id, occurred_at DESC);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_correlation ON audit_events(correlation_id);
