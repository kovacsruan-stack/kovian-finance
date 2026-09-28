# KOVIAN Integration

KOVIAN Finance remains the source of truth for financial-domain facts.

## Identity
Finance consumes the canonical ecosystem subject identifier while retaining ownership of financial accounts, transactions and ledger state. A caller's authenticated Finance subject is authoritative; client-supplied owner IDs never override it.

## Gestão payment ingestion

The Finance API now exposes `POST /api/v1/integrations/gestao/payments?account_id={account_id}`.

- Requires a valid Finance Bearer token. The event `ownerId` must match the authenticated Finance user.
- Accepts the versioned `MANAGEMENT_PAYMENT_PAID.v1` event shape, rejects unknown fields, and requires timezone-aware timestamps.
- Currently accepts BRL only and converts integer cents to a decimal amount without floating-point arithmetic.
- Requires an active account owned by the authenticated user and matching the event currency.
- Creates a confirmed income transaction and an import record in one database transaction.
- Enforces unique event ID and source payment reference per user. Repeated identical event deliveries return the original transaction; conflicting replays return HTTP 409.
- Stores stable student references only; student names and contact details are not accepted by the event schema.
- Database migration: `0002_gestao_payment_imports`.

**Integration boundary:** this is a user-authenticated ingestion endpoint, not yet a trusted server-to-server connection from Gestão. Do not send unattended events from the Gestão backend until service authentication, canonical cross-product identity mapping, and producer-side event signing or equivalent verification are implemented. The current endpoint is suitable for an explicitly user-authorized flow only.

Reversals must use a separate audited flow referencing the original transaction; posted ledger facts must not be silently rewritten.

## Analytics
Finance emits governed events using schema kovian.event.v1. Events are tenant-scoped, minimized and purpose-bound. Analytics does not become the source of truth for ledger facts.

## KOVI AI
KOVI AI receives read-only governed context through the Finance integration contract. Financial mutations remain Finance-owned.

## Deletion
Subject deletion marks derived analytics records for deletion. Retention cleanup permanently removes only records that are both deleted and outside the retention window.
