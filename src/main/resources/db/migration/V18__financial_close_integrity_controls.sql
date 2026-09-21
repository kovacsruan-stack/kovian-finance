alter table financial_close_period add column if not exists updated_at timestamptz not null default now();
alter table financial_close_period add column if not exists close_checksum varchar(128);
alter table reconciliation_run add constraint chk_reconciliation_counts_nonnegative check(matched_count>=0 and exception_count>=0);
create or replace function touch_financial_close_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists trg_financial_close_updated_at on financial_close_period;
create trigger trg_financial_close_updated_at before update on financial_close_period for each row execute function touch_financial_close_updated_at();
create table if not exists financial_close_evidence (
 id uuid primary key default gen_random_uuid(),
 close_period_id uuid not null references financial_close_period(id) on delete cascade,
 evidence_type varchar(60) not null check(evidence_type in ('RECONCILIATION','BALANCE','EXCEPTION_REVIEW','APPROVAL','EXPORT','OTHER')),
 checksum varchar(128),
 evidence jsonb not null default '{}'::jsonb,
 created_by uuid,
 created_at timestamptz not null default now()
);
create index if not exists idx_financial_close_evidence_period on financial_close_evidence(close_period_id,created_at desc);
