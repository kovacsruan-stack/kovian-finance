ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS ck_financial_transactions_type;
ALTER TABLE financial_transactions ADD CONSTRAINT ck_financial_transactions_type CHECK (transaction_type IN ('INCOME','EXPENSE','TRANSFER','CARD_PAYMENT'));

-- Repair settlements created by the previous implementation so they stop inflating expense totals.
UPDATE financial_transactions
SET transaction_type = 'CARD_PAYMENT'
WHERE external_id LIKE 'card-invoice:%'
  AND transaction_type = 'EXPENSE';
