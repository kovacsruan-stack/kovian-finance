# KOVIAN Integration

KOVIAN Finance remains the source of truth for financial-domain facts.

## Identity
Finance consumes the canonical ecosystem subject identifier while retaining ownership of financial accounts, transactions and ledger state. A caller's authenticated Finance subject is authoritative; client-supplied owner IDs never override it.

## Gestão payment ingestion

The Finance API now exposes `POST /api/v1/integrations/gestao/payments?account_id={account_id}`.

- Supports a Finance Bearer token for interactive calls or the configured service Bearer token with server-side owner and account mappings.
- Accepts the versioned `MANAGEMENT_PAYMENT_PAID.v1` event shape, rejects unknown fields, and requires timezone-aware timestamps.
- Currently accepts BRL only and converts integer cents to a decimal amount without floating-point arithmetic.
- Requires an active account owned by the authenticated user and matching the event currency.
- Creates a confirmed income transaction and an import record in one database transaction.
- Enforces unique event ID and source payment reference per Gestão owner. Repeated identical event deliveries return the original transaction; conflicting replays return HTTP 409.
- Stores stable student references only; student names and contact details are not accepted by the event schema.
- Database migration: `0002_gestao_payment_imports`.

**Authentication modes:**
- Interactive mode: a Finance Bearer token is required and `ownerId` must equal the authenticated Finance user ID.
- Service mode: configure `GESTAO_INTEGRATION_TOKEN` with a high-entropy secret of at least 32 characters. Requests using that exact Bearer token resolve `ownerId` through the server-side `GESTAO_OWNER_MAP` JSON object, whose keys are canonical Gestão owner UUIDs and whose values are Finance user IDs. The mapped Finance user must exist and be active. Service requests must also match the server-side `GESTAO_ACCOUNT_MAP` entry for that owner; arbitrary account selection is rejected.
- Keep the service token in the deployment secret manager, rotate it when exposed, and never place it in browser code or the Gestão client. Configure the owner map only on the Finance server.

**Integration boundary:** service authentication and server-side identity mapping are now supported by the endpoint, but unattended production delivery still requires deployment configuration, secret provisioning, verified owner mappings, verified `GESTAO_ACCOUNT_MAP` entries, and end-to-end testing. The endpoint currently receives `account_id` as a request parameter; the service must only submit an account approved for that mapped owner. Do not treat a preview deployment or this pull request as production activation.

Reversals must use a separate audited flow referencing the original transaction; posted ledger facts must not be silently rewritten.

## Analytics
Finance emits governed events using schema kovian.event.v1. Events are tenant-scoped, minimized and purpose-bound. Analytics does not become the source of truth for ledger facts.

## KOVI AI
KOVI AI receives read-only governed context through the Finance integration contract. Financial mutations remain Finance-owned.

## Deletion
Subject deletion marks derived analytics records for deletion. Retention cleanup permanently removes only records that are both deleted and outside the retention window.
