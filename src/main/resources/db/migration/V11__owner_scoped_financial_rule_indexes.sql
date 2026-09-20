-- V11: owner-scoped indexes for multi-tenant scheduled financial rules.
create index if not exists idx_credit_card_invoices_owner_due_status
  on credit_card_invoices(owner_id, due_date, status);

create index if not exists idx_recurring_transactions_owner_active_next
  on recurring_transactions(owner_id, active, next_occurrence);

create index if not exists idx_debts_owner_status_outstanding_start
  on debts(owner_id, status, outstanding_amount, start_date);

create index if not exists idx_financial_goals_owner_active_target
  on financial_goals(owner_id, active, target_date);

create index if not exists idx_financial_accounts_owner
  on financial_accounts(owner_id);