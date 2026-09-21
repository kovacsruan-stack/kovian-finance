# KOVIAN Finance Production Target

KOVIAN Finance is the financial-domain source of truth for KOVIAN.

## Production domains
- accounts and balances
- transactions and ledger integrity
- budgets and goals
- recurring commitments
- cards, invoices and purchases
- debts and assets
- financial rules
- forecast, scenarios and anomaly detection
- reconciliation and imports
- notifications
- audit and security
- outbox/event transport
- KOVI read-only intelligence context

## Financial invariants

Financial mutations must remain owner-scoped, precise, idempotent where required and auditable. Cancelled or superseded records must not silently re-enter aggregates.

## KOVI contract

KOVI can consume bounded financial context for intelligence and project workflows. Finance remains authoritative for financial facts and critical financial mutations.

## Current implementation direction

The core platform and intelligence layer are substantially implemented. The remaining work is concentrated on accounting/reconciliation depth, critical mutation lifecycle, external connector boundaries, governed exports, operational recovery and final validation.
