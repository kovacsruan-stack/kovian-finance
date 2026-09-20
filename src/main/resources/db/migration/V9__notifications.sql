CREATE TABLE notifications (
 id UUID PRIMARY KEY,
 owner_id UUID NOT NULL,
 type VARCHAR(60) NOT NULL,
 severity VARCHAR(20) NOT NULL,
 title VARCHAR(180) NOT NULL,
 message VARCHAR(1000) NOT NULL,
 entity_type VARCHAR(80),
 entity_id UUID,
 deduplication_key VARCHAR(180) NOT NULL,
 read_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_notification_severity CHECK (severity IN ('INFO','WARNING','CRITICAL')),
 CONSTRAINT uq_notification_owner_dedupe UNIQUE(owner_id,deduplication_key)
);
CREATE INDEX idx_notifications_owner_created ON notifications(owner_id,created_at DESC);
CREATE INDEX idx_notifications_owner_unread ON notifications(owner_id,read_at,created_at DESC);