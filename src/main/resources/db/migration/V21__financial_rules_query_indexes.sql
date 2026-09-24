-- V21: align scheduled-rule indexes with owner/status/date access patterns.
create index if not exists idx_debt_installments_owner_status_due
  on debt_installments(owner_id, status, due_date);

create index if not exists idx_financial_transactions_owner_status_type_occurred
  on financial_transactions(owner_id, status, transaction_type, occurred_at desc);

create index if not exists idx_financial_goals_owner_active_target
  on financial_goals(owner_id, active, target_date);
