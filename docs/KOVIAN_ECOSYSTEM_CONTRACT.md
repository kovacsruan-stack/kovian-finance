# KOVIAN Ecosystem Contract

## Ownership

KOVIAN Finance is authoritative for financial-domain records, accounting invariants, financial calculations and the integrated Gestão records managed by the unified application.

## KOVI access

KOVI consumes financial context through governed read-only federation by default. Financial mutation capabilities require an explicit contract, authorization, audit trail and risk-aware approval.

## Contract requirements

Cross-system requests must carry authenticated identity, owner/workspace context, capability, correlation identity, timestamp/TTL and replay protection where applicable.

Financial responses must be bounded, versioned and must not expose credentials, provider tokens or unnecessary sensitive data.

## Commercial Builder boundary

A commercial project may consume Finance capabilities only through declared versioned contracts. The project must not bypass Finance to directly mutate authoritative financial records.

## Evolution

Breaking changes require a new contract version and compatibility/deprecation handling.
 

## 2026-09-21 commercial-builder alignment

KOVI AI now models commercial software as a first-class Project. When KOVI DEV changes Finance, the intended relationship is:

Project -> Finance-bound DevTask -> governed repository changes -> verification evidence -> release -> Finance production gate.

Finance remains the financial source of truth even when KOVI is the engineering orchestrator.

The ecosystem master specification is maintained in KOVI AI; this document is the Finance-side boundary contract and should be consulted before cross-product changes.
