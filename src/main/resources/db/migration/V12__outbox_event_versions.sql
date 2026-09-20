-- V12: version persisted outbox event contracts for safe consumer evolution.
alter table outbox_events add column if not exists event_version integer not null default 1;
create index if not exists idx_outbox_events_type_version on outbox_events(event_type,event_version,created_at desc);