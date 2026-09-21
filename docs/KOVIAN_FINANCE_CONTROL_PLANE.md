# KOVIAN Finance Control Plane

## Reconciliation

Reconciliation runs now have a durable exception model covering missing records, amount/date mismatches, duplicates, unmatched entries and invalid references. Exceptions retain evidence and an explicit resolution state.

## Operation idempotency

Critical financial mutations can use an owner-scoped operation key and request checksum. Reusing a key with a different checksum must be treated as a conflict rather than silently replaying a mutation.

## Close and export

Financial close periods and governed data exports are persisted separately from ordinary transactions. A closed period must require an explicit reopen workflow before mutation, while exports must have controlled scope, expiry and checksum evidence.

## Production rule

These tables are control-plane foundations. The corresponding application services must enforce owner isolation, accounting invariants, transaction boundaries, idempotency conflicts and close-period restrictions before these workflows are considered operationally complete.
