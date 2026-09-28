# KOVIAN Integration

KOVIAN Finance remains the source of truth for financial-domain facts.

## Identity
Finance consumes the canonical ecosystem subject identifier while retaining ownership of financial accounts, transactions and ledger state. A caller's authenticated subject is authoritative; client-supplied owner IDs must never override it.

## Gestão payment events

The monorepo contract is `contracts/events/management-payment-paid-v1.schema.json` and defines `MANAGEMENT_PAYMENT_PAID.v1`. The Finance adapter is **not implemented yet**; this section records the required behavior before adding a write endpoint.

- Authenticate the producer or validate a signed service credential; do not accept an event based only on a browser-provided payload.
- Resolve the event's `ownerId` to the authenticated Finance subject using an explicit, server-side mapping.
- Validate the schema and require `currency = BRL`; convert `amountMinor` to a decimal amount without floating-point arithmetic.
- Store both the event ID and the source payment reference under database uniqueness constraints. Event-ID deduplication alone is insufficient if a producer retries the same payment with a new event ID.
- Create one income transaction only after validating that the target account belongs to the resolved user and uses the same currency.
- Treat a retry as success by returning the already-created transaction. A conflicting reuse of a source payment reference must be rejected and audited.
- Keep student names, contact details, and other personal data out of the event and financial description. Use a stable external reference for reconciliation.
- Represent reversals with a separate audited event referencing the original transaction; never silently rewrite a posted ledger fact.

The adapter must be introduced with a reviewed database migration, contract tests, authorization tests, idempotency tests, and rollback guidance. Until those are complete, no Gestão payment should be automatically written into Finance.

## Analytics
Finance emits governed events using schema kovian.event.v1. Events are tenant-scoped, minimized and purpose-bound. Analytics does not become the source of truth for ledger facts.

## KOVI AI
KOVI AI receives read-only governed context through the Finance integration contract. Financial mutations remain Finance-owned.

## Deletion
Subject deletion marks derived analytics records for deletion. Retention cleanup permanently removes only records that are both deleted and outside the retention window.
