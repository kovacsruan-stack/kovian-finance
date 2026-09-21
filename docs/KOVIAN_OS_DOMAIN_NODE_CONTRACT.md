# KOVIAN OS Domain Application Contract

Finance is a first-class KOVIAN OS application.

## Exposed capability classes
- bounded financial context;
- forecasting/reporting context;
- reconciliation and close evidence;
- governed exports;
- approved financial actions.

## Execution boundary
KOVIAN OS Nodes may host Finance application/runtime workloads, but Nodes do not own financial data. All financial writes remain inside Finance services.

## Agent boundary
Agent capabilities must be:
- declared;
- scoped;
- owner-authorized;
- idempotent where applicable;
- auditable.

## Financial boundary
RLS, owner isolation, reconciliation, close controls and evidence remain authoritative.

## Commercial builder boundary
KOVI DEV can create or modify Finance code through governed repository workflows. It cannot bypass Finance service boundaries.
