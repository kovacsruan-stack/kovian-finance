CREATE TABLE management_records (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    resource VARCHAR(24) NOT NULL,
    source_id VARCHAR(120),
    data JSONB NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_management_records_resource CHECK (resource IN ('students','modalities','lessons','payments')),
    CONSTRAINT uq_management_record_owner_resource_source UNIQUE (owner_id, resource, source_id)
);

CREATE INDEX idx_management_records_owner_resource_created
    ON management_records(owner_id, resource, created_at DESC);
CREATE INDEX idx_management_records_owner_resource_active
    ON management_records(owner_id, resource, is_archived, created_at DESC);
