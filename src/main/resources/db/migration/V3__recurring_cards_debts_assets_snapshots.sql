CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES financial_accounts(id),
    category_id UUID REFERENCES transaction_categories(id),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('INCOME','EXPENSE')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('WEEKLY','MONTHLY','YEARLY')),
    next_occurrence DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_recurring_owner_next ON recurring_transactions(owner_id, next_occurrence, active);

CREATE TABLE credit_cards (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    brand VARCHAR(60),
    last_four VARCHAR(4),
    credit_limit NUMERIC(19,4) NOT NULL CHECK (credit_limit >= 0),
    closing_day SMALLINT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','BLOCKED','ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, name)
);
CREATE INDEX idx_cards_owner ON credit_cards(owner_id);

CREATE TABLE credit_card_invoices (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    card_id UUID NOT NULL REFERENCES credit_cards(id),
    reference_month DATE NOT NULL,
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN','CLOSED','PAID','OVERDUE')),
    total_amount NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    paid_amount NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(card_id, reference_month)
);
CREATE INDEX idx_invoice_owner_due ON credit_card_invoices(owner_id, due_date, status);

CREATE TABLE credit_card_purchases (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    card_id UUID NOT NULL REFERENCES credit_cards(id),
    invoice_id UUID NOT NULL REFERENCES credit_card_invoices(id),
    description VARCHAR(255) NOT NULL,
    total_amount NUMERIC(19,4) NOT NULL CHECK (total_amount > 0),
    installment_amount NUMERIC(19,4) NOT NULL CHECK (installment_amount > 0),
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    purchased_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_purchase_invoice ON credit_card_purchases(invoice_id);

CREATE TABLE debts (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    debt_type VARCHAR(30) NOT NULL CHECK (debt_type IN ('LOAN','FINANCING','OTHER')),
    principal_amount NUMERIC(19,4) NOT NULL CHECK (principal_amount > 0),
    outstanding_amount NUMERIC(19,4) NOT NULL CHECK (outstanding_amount >= 0),
    annual_interest_rate NUMERIC(10,6),
    start_date DATE NOT NULL,
    end_date DATE,
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','PAID','CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_debt_owner_status ON debts(owner_id, status);

CREATE TABLE debt_installments (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    debt_id UUID NOT NULL REFERENCES debts(id),
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    due_date DATE NOT NULL,
    principal_amount NUMERIC(19,4) NOT NULL CHECK (principal_amount >= 0),
    interest_amount NUMERIC(19,4) NOT NULL CHECK (interest_amount >= 0),
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','PAID','OVERDUE')),
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_transaction_id UUID REFERENCES financial_transactions(id),
    UNIQUE(debt_id, installment_number)
);
CREATE INDEX idx_debt_installment_owner_due ON debt_installments(owner_id, due_date, status);

CREATE TABLE financial_assets (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    asset_type VARCHAR(40) NOT NULL,
    acquisition_value NUMERIC(19,4) NOT NULL CHECK (acquisition_value >= 0),
    current_value NUMERIC(19,4) NOT NULL CHECK (current_value >= 0),
    liquidity VARCHAR(20) NOT NULL CHECK (liquidity IN ('HIGH','MEDIUM','LOW')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, name)
);
CREATE INDEX idx_asset_owner_active ON financial_assets(owner_id, active);

CREATE TABLE financial_liabilities (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    liability_type VARCHAR(40) NOT NULL,
    amount NUMERIC(19,4) NOT NULL CHECK (amount >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, name)
);
CREATE INDEX idx_liability_owner_active ON financial_liabilities(owner_id, active);

CREATE TABLE financial_snapshots (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    total_income NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_expense NUMERIC(19,4) NOT NULL DEFAULT 0,
    net_cash_flow NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_assets NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_liabilities NUMERIC(19,4) NOT NULL DEFAULT 0,
    net_worth NUMERIC(19,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, snapshot_date)
);
CREATE INDEX idx_snapshot_owner_date ON financial_snapshots(owner_id, snapshot_date);
