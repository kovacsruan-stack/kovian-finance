# KOVIAN OS Domain Node Contract

Finance is a KOVIAN OS domain application, not an execution node.

## OS capabilities
Finance may expose:
- bounded financial context;
- reporting/forecast context;
- reconciliation and close evidence;
- governed exports;
- approved financial actions through Finance-owned services.

## Rules
- OS nodes execute workloads; Finance owns financial data.
- Agent capabilities are declared, scoped and auditable.
- No arbitrary node command can mutate financial persistence.
- RLS, owner isolation and idempotency remain authoritative.
- Production financial operations remain behind Finance controls.

This contract lets KOVIAN OS treat Finance as a first-class application while preserving financial ownership and auditability.
