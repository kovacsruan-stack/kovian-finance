ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS ck_financial_transactions_type;
ALTER TABLE financial_transactions ADD CONSTRAINT ck_financial_transactions_type CHECK (transaction_type IN ('INCOME','EXPENSE','TRANSFER','CARD_PAYMENT'));
