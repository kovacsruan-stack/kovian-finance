create table if not exists reconciliation_exception (
 id uuid primary key default gen_random_uuid(),
 reconciliation_run_id uuid not null references reconciliation_run(id) on delete cascade,
 owner_id uuid not null,
 account_id uuid,
 exception_type varchar(60) not null check(exception_type in ('MISSING_SOURCE','MISSING_INTERNAL','AMOUNT_MISMATCH','DATE_MISMATCH','DUPLICATE','UNMATCHED','INVALID_REFERENCE','OTHER')),
 status varchar(24) not null default 'OPEN' check(status in ('OPEN','INVESTIGATING','RESOLVED','ACCEPTED')),
 external_reference varchar(500),
 internal_reference varchar(500),
 expected_amount numeric(19,4),
 observed_amount numeric(19,4),
 currency char(3),
 evidence jsonb not null default '{}'::jsonb,
 resolution_notes varchar(4000),
 resolved_by uuid,
 resolved_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists idx_reconciliation_exception_owner_status on reconciliation_exception(owner_id,status,created_at desc);
create index if not exists idx_reconciliation_exception_run on reconciliation_exception(reconciliation_run_id,status);
