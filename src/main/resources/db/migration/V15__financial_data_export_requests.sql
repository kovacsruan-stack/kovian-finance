create table if not exists financial_data_export_request (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 status varchar(24) not null default 'REQUESTED' check(status in ('REQUESTED','PROCESSING','READY','EXPIRED','CANCELLED','FAILED')),
 scope jsonb not null default '{}'::jsonb,
 format varchar(20) not null default 'JSON' check(format in ('JSON','CSV')),
 file_reference varchar(1000),
 checksum varchar(128),
 requested_at timestamptz not null default now(),
 completed_at timestamptz,
 expires_at timestamptz
);
create index if not exists idx_financial_export_owner_status on financial_data_export_request(owner_id,status,requested_at desc);