create table if not exists financial_operation_idempotency (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null,
 operation_key varchar(200) not null,
 operation_type varchar(100) not null,
 request_checksum varchar(128) not null,
 response_status varchar(30),
 response_body jsonb,
 created_at timestamptz not null default now(),
 expires_at timestamptz,
 unique(owner_id,operation_key,operation_type)
);
create index if not exists idx_financial_idempotency_expiry on financial_operation_idempotency(expires_at);
