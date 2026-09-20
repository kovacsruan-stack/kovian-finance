CREATE TABLE budgets (
 id UUID PRIMARY KEY, owner_id UUID NOT NULL, category_id UUID NOT NULL REFERENCES transaction_categories(id),
 period VARCHAR(20) NOT NULL, period_start TIMESTAMPTZ NOT NULL, limit_amount NUMERIC(19,4) NOT NULL, created_at TIMESTAMPTZ NOT NULL,
 CONSTRAINT ck_budget_period CHECK(period IN ('MONTHLY','WEEKLY','YEARLY')), CONSTRAINT ck_budget_limit CHECK(limit_amount >= 0),
 CONSTRAINT uq_budget_owner_category_period UNIQUE(owner_id,category_id,period_start)
);
CREATE INDEX idx_budgets_owner_period ON budgets(owner_id,period_start DESC);

CREATE TABLE financial_goals (
 id UUID PRIMARY KEY, owner_id UUID NOT NULL, name VARCHAR(140) NOT NULL, target_amount NUMERIC(19,4) NOT NULL,
 current_amount NUMERIC(19,4) NOT NULL DEFAULT 0, target_date TIMESTAMPTZ NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL,
 CONSTRAINT ck_goal_target CHECK(target_amount > 0), CONSTRAINT ck_goal_current CHECK(current_amount >= 0)
);
CREATE INDEX idx_financial_goals_owner_active ON financial_goals(owner_id,active,target_date);
