-- V18: owner/status/due-date index for scheduled debt installment notifications.
create index if not exists idx_debt_installments_owner_status_due
  on debt_installments(owner_id, status, due_date);
