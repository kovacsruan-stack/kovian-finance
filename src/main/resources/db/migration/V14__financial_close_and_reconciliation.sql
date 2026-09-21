create table if not exists financial_close_period (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 period_start date not null,
 period_end date not null,
 status varchar(24) not null default 'OPEN' check(status in ('OPEN','REVIEW','CLOSED','REOPENED')),
 opened_at timestamptz not null default now(),
 closed_at timestamptz,
 closed_by uuid,
 notes varchar(4000),
 unique(owner_id,period_start,period_end),
 check(period_end>=period_start)
);
create index if not exists idx_financial_close_owner_status on financial_close_period(owner_id,status,period_end desc);
create table if not exists reconciliation_run (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 account_id uuid,
 period_start date not null,
 period_end date not null,
 status varchar(24) not null default 'STARTED' check(status in ('STARTED','RUNNING','MATCHED','EXCEPTIONS','COMPLETED','FAILED')),
 source_checksum varchar(128),
 matched_count integer not null default 0,
 exception_count integer not null default 0,
 evidence jsonb not null default '{}'::jsonb,
 started_at timestamptz not null default now(),
 completed_at timestamptz
);
create index if not exists idx_reconciliation_owner_period on reconciliation_run(owner_id,period_end desc,status);