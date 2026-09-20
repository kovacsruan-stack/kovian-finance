CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    account_type VARCHAR(30) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'BRL',
    opening_balance NUMERIC(19,4) NOT NULL DEFAULT 0,
    current_balance NUMERIC(19,4) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_financial_accounts_type CHECK (account_type IN ('CHECKING','SAVINGS','CASH','INVESTMENT','OTHER')),
    CONSTRAINT ck_financial_accounts_status CHECK (status IN ('ACTIVE','ARCHIVED')),
    CONSTRAINT uq_financial_account_owner_name UNIQUE (owner_id, name)
);

CREATE TABLE transaction_categories (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    kind VARCHAR(20) NOT NULL,
    parent_id UUID NULL REFERENCES transaction_categories(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_transaction_categories_kind CHECK (kind IN ('INCOME','EXPENSE')),
    CONSTRAINT uq_transaction_category_owner_name_kind UNIQUE (owner_id, name, kind)
);

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES financial_accounts(id),
    category_id UUID NULL REFERENCES transaction_categories(id),
    external_id VARCHAR(180) NULL,
    description VARCHAR(240) NOT NULL,
    amount NUMERIC(19,4) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'POSTED',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_financial_transactions_amount CHECK (amount > 0),
    CONSTRAINT ck_financial_transactions_type CHECK (transaction_type IN ('INCOME','EXPENSE','TRANSFER')),
    CONSTRAINT ck_financial_transactions_status CHECK (status IN ('PENDING','POSTED','CANCELLED')),
    CONSTRAINT uq_financial_transaction_external UNIQUE (owner_id, external_id)
);

CREATE INDEX idx_financial_accounts_owner ON financial_accounts(owner_id);
CREATE INDEX idx_financial_transactions_owner_date ON financial_transactions(owner_id, occurred_at DESC);
CREATE INDEX idx_financial_transactions_account_date ON financial_transactions(account_id, occurred_at DESC);
CREATE INDEX idx_financial_transactions_category ON financial_transactions(category_id);
