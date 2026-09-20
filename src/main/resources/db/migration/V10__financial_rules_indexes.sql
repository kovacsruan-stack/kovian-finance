-- V10: indexes supporting bounded financial rule evaluation.
create index if not exists idx_financial_transactions_owner_occurred_status
  on financial_transactions(owner_id, occurred_at desc, status);

create index if not exists idx_credit_card_invoices_due_status
  on credit_card_invoices(due_date, status);

create index if not exists idx_recurring_transactions_active_next_occurrence
  on recurring_transactions(active, next_occurrence);

create index if not exists idx_debts_status_outstanding_start_date
  on debts(status, outstanding_amount, start_date);

create index if not exists idx_financial_goals_active_target_date
  on financial_goals(active, target_date);
