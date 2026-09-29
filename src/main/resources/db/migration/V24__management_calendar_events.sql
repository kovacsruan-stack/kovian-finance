ALTER TABLE management_records
    DROP CONSTRAINT ck_management_records_resource;

ALTER TABLE management_records
    ADD CONSTRAINT ck_management_records_resource
    CHECK (resource IN ('students','modalities','lessons','payments','expenses','waitlist','calendar_events'));
