# KOVIAN Finance Control Plane

## Reconciliation

Reconciliation runs now have a durable exception model covering missing records, amount/date mismatches, duplicates, unmatched entries and invalid references. Exceptions retain evidence and an explicit resolution state.

## Operation idempotency

Critical financial mutations can use an owner-scoped operation key and request checksum. Reusing a key with a different checksum must be treated as a conflict rather than silently replaying a mutation.

## Close and export

Financial close periods and governed data exports are persisted separately from ordinary transactions. A closed period must require an explicit reopen workflow before mutation, while exports must have controlled scope, expiry and checksum evidence.

## Production rule

These tables are control-plane foundations. The corresponding application services must enforce owner isolation, accounting invariants, transaction boundaries, idempotency conflicts and close-period restrictions before these workflows are considered operationally complete.


## 2026-09-21 KOVI commercial builder compatibility checkpoint

KOVIAN Finance is explicitly provisioned as a governed financial domain module for the KOVI commercial project-builder model.

KOVI may inspect, extend and maintain Finance through governed repository/project workflows, but Finance remains the authoritative owner of financial persistence and invariants.

Mandatory boundaries:
- owner isolation and RLS;
- idempotency;
- reconciliation and close controls;
- evidence-backed exports;
- production release gates;
- no direct KOVI writes to financial tables.

The reusable external finance references remain pattern references until license, security and commercial compatibility are reviewed for each component.
