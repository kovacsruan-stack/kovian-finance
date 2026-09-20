CREATE TABLE import_batches (
 id UUID PRIMARY KEY,
 owner_id UUID NOT NULL,
 account_id UUID NOT NULL,
 filename VARCHAR(255) NOT NULL,
 format VARCHAR(20) NOT NULL,
 status VARCHAR(20) NOT NULL,
 total_rows INTEGER NOT NULL DEFAULT 0,
 imported_rows INTEGER NOT NULL DEFAULT 0,
 duplicate_rows INTEGER NOT NULL DEFAULT 0,
 failed_rows INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 completed_at TIMESTAMPTZ,
 last_error VARCHAR(1000),
 CONSTRAINT ck_import_format CHECK (format IN ('CSV')),
 CONSTRAINT ck_import_status CHECK (status IN ('PROCESSING','COMPLETED','PARTIAL','FAILED'))
);
CREATE INDEX idx_import_batches_owner_created ON import_batches(owner_id,created_at DESC);

CREATE TABLE import_row_errors (
 id UUID PRIMARY KEY,
 batch_id UUID NOT NULL REFERENCES import_batches(id),
 row_number INTEGER NOT NULL,
 raw_data TEXT,
 error_code VARCHAR(80) NOT NULL,
 error_message VARCHAR(1000) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_import_row_errors_batch ON import_row_errors(batch_id,row_number);

CREATE TABLE reconciliation_runs (
 id UUID PRIMARY KEY,
 owner_id UUID NOT NULL,
 account_id UUID NOT NULL,
 expected_balance DECIMAL(19,4) NOT NULL,
 actual_balance DECIMAL(19,4) NOT NULL,
 difference DECIMAL(19,4) NOT NULL,
 status VARCHAR(20) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_reconciliation_status CHECK (status IN ('MATCHED','DIVERGED'))
);
CREATE INDEX idx_reconciliation_owner_created ON reconciliation_runs(owner_id,created_at DESC);