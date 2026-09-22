# KOVIAN Finance Open Source Accelerator Plan

Finance remains the accounting source of truth.
External billing accelerators may handle subscriptions, metering or payment orchestration, but financial invariants stay local.
## Kill Bill

Kill Bill is an Apache-2.0 Java billing platform and is the strongest isolated billing-service candidate.
The new adapter is disabled by default and does not alter the local ledger or ownership rules.
## Lago

Lago is an AGPL candidate for isolated usage billing and entitlement workloads.
The new adapter is disabled by default and can receive governed usage events without moving accounting ownership out of Finance.
## Actual Budget

Actual Budget is MIT and is a domain/UX reference for accounts, categories, budgets and reconciliation.
Finance keeps its own schema and business invariants.
