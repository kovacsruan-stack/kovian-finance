# KOVI Federation Contract — Finance

Status: **contract baseline — Finance remains authoritative**  
Version: **1.0**  
Date: **2026-09-24**

## Source of truth

KOVIAN Finance remains the sole source of truth for accounts, balances, transactions, revenue, planning context, summaries, forecasts, risk and cash-flow data.

KOVI AI consumes the existing Finance read-only surface. The current Finance contract is **1.4** and remains authoritative. This document does not replace, duplicate or fork Finance 1.4.

## Read-only surface exposed to KOVI

The supported capabilities are:

`accounts`, `balance`, `transactions`, `revenue`, `context`, `summary`, `forecast`, `risk`, `cash-flow`.

No KOVI capability may write canonical Finance records through this surface.

## Federation security

Internal KOVI requests must use the existing signed service-identity boundary and carry:

- Finance domain identity
- workspace id
- acting user id
- explicit permissions
- explicit allowed tool/capability
- issued-at / expiry
- nonce
- request id
- signature over the exact canonical request

Finance must re-apply its own authentication/authorization rules after validating the federation envelope.

## Replay and idempotency

Read operations should still reject stale/replayed signed envelopes. Nonces must be single-use. Request IDs must be traceable. If an endpoint is retried, the same request digest must be associated with the same request ID; conflicting reuse is a `409`-class contract failure.

## Versioning

Finance 1.4 is the current compatibility baseline. Additive response fields are allowed only when they preserve existing semantics. Removing, renaming, changing types or changing authorization semantics requires a new contract version and an explicit compatibility gate before KOVI adoption.

KOVI must not reconstruct financial aggregates from partial domain tables when the corresponding Finance 1.4 capability already provides the authoritative result.

## Observability

Emit structured correlation metadata without secrets or financial payload dumps:

`requestId`, `domain`, `workspaceId`, `userId`, `capability`, `contractVersion`, `outcome`, `latencyMs`, `errorClass`.

Never log internal API keys, HMAC secrets, signatures or full transaction payloads.

## Validation gate

Before promotion of an integration change, require:

1. Finance 1.4 contract compatibility tests;
2. authorization boundary tests;
3. stale/replay/idempotency tests;
4. representative read-only fixtures with non-sensitive values;
5. KOVI consumer integration tests;
6. runtime/health evidence against the actual configured environment.

Passing source-level tests is not production evidence by itself.
