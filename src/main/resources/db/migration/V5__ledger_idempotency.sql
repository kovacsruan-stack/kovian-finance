CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    operation VARCHAR(80) NOT NULL,
    idempotency_key VARCHAR(200) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    resource_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_idempotency_owner_operation_key UNIQUE (owner_id, operation, idempotency_key)
);

CREATE INDEX idx_idempotency_owner_created ON idempotency_records(owner_id, created_at DESC);

CREATE TABLE ledger_transfers (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    from_account_id UUID NOT NULL,
    to_account_id UUID NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    description VARCHAR(240) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_ledger_transfer_amount CHECK (amount > 0),
    CONSTRAINT ck_ledger_transfer_distinct_accounts CHECK (from_account_id <> to_account_id),
    CONSTRAINT ck_ledger_transfer_status CHECK (status IN ('POSTED','REVERSED'))
);

CREATE INDEX idx_ledger_transfers_owner_created ON ledger_transfers(owner_id, created_at DESC);
CREATE INDEX idx_ledger_transfers_accounts ON ledger_transfers(from_account_id, to_account_id);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY,
    transfer_id UUID NOT NULL REFERENCES ledger_transfers(id),
    account_id UUID NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_ledger_entry_amount CHECK (amount <> 0)
);

CREATE INDEX idx_ledger_entries_transfer ON ledger_entries(transfer_id);
CREATE INDEX idx_ledger_entries_account_created ON ledger_entries(account_id, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_ledger_entry_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Ledger entries are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_entries_immutable
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_entry_mutation();

CREATE OR REPLACE FUNCTION validate_ledger_transfer_balance()
RETURNS trigger AS $$
DECLARE
    total DECIMAL(19,4);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM ledger_entries
    WHERE transfer_id = NEW.transfer_id;

    IF total <> 0 THEN
        RAISE EXCEPTION 'Ledger transfer % is not balanced', NEW.transfer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_ledger_transfer_balanced
AFTER INSERT ON ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validate_ledger_transfer_balance();
