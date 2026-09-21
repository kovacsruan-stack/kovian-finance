# KOVIAN Finance — KOVI Builder Integration Contract

Status: IMPLEMENTED FOUNDATION — 2026-09-21

## Domain ownership
Finance remains authoritative for accounts, transactions, balances, reconciliation, close periods, forecasts, financial controls and financial exports. KOVI AI is the generative intelligence/orchestration layer.

## Builder-safe capabilities
- expose bounded read-only financial context;
- preserve owner isolation and RLS;
- preserve idempotency and reconciliation invariants;
- expose close/reconciliation/export evidence;
- support governed integration grants;
- provide deterministic data to KOVI without allowing KOVI to become the accounting source of truth.

## Project-builder integration rules
1. KOVI can inspect and modify Finance only through governed project/repository workflows.
2. KOVI must not bypass Finance service boundaries or write directly to financial tables.
3. Production changes must pass build, verification, security and release gates.
4. Financial exports and close/reconciliation operations require their existing controls.
5. External open-source finance patterns remain references unless license and security review approves integration.

## Commercial builder readiness
Finance is treated as a domain module that KOVI can provision, integrate, extend and maintain while preserving strict financial ownership boundaries.
