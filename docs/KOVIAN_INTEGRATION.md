# KOVIAN Integration

KOVIAN Finance remains the source of truth for financial-domain facts.

## Identity
Finance consumes the canonical ecosystem subject identifier while retaining ownership of financial accounts, transactions and ledger state. A caller's authenticated subject is authoritative; client-supplied owner IDs must never override it.

## Gestão payment events

The monorepo contract is `contracts/events/management-payment-paid-v1.schema.json` and defines `MANAGEMENT_PAYMENT_PAID.v1`. A first Finance ingestion endpoint now exists on the separate implementation branch / PR #34. This document defines the security and operational requirements for completing the producer-side integration; the endpoint is not production-enabled by this documentation change.

- Authenticate the producer with a high-entropy service credential or equivalent signed request; do not accept an event based only on a browser-provided payload. The Finance foundation supports a server-configured `GESTAO_INTEGRATION_TOKEN`.
- Resolve the event's `ownerId` to the Finance subject using the server-side `GESTAO_OWNER_MAP`; never trust a client-provided Finance user ID. For service calls, require `account_id` to match the server-side `GESTAO_ACCOUNT_MAP` entry for that owner.
- Validate the schema and require `currency = BRL`; convert `amountMinor` to a decimal amount without floating-point arithmetic.
- Store both the event ID and the source payment reference under database uniqueness constraints. Event-ID deduplication alone is insufficient if a producer retries the same payment with a new event ID.
- Create one income transaction only after validating that the target account belongs to the resolved user and uses the same currency.
- Treat a retry as success by returning the already-created transaction. A conflicting reuse of a source payment reference must be rejected and audited.
- Keep student names, contact details, and other personal data out of the event and financial description. Use a stable external reference for reconciliation.
- Represent reversals with a separate audited event referencing the original transaction; never silently rewrite a posted ledger fact.

The Finance ingestion foundation includes a database migration and initial contract/route tests, but deployment configuration, producer-side delivery, account-selection policy, end-to-end tests, and rollback rehearsal remain outstanding. Until those are complete and reviewed, no production Gestão payment should be automatically written into Finance.

## Analytics
Finance emits governed events using schema kovian.event.v1. Events are tenant-scoped, minimized and purpose-bound. Analytics does not become the source of truth for ledger facts.

## KOVI AI
KOVI AI receives read-only governed context through the Finance integration contract. Financial mutations remain Finance-owned.

## Deletion
Subject deletion marks derived analytics records for deletion. Retention cleanup permanently removes only records that are both deleted and outside the retention window.
