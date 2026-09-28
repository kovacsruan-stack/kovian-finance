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


## Release-gate audit — 2026-09-28

The ingestion endpoint and persistence layer have been reviewed as part of PR #34. The following items remain release blockers and must be resolved before enabling unattended delivery:

- **Replay integrity:** the current duplicate-event path compares the payment and student references, amount, account, and paid timestamp, but does not persist or compare a canonical fingerprint of the complete event. Reuse of an event ID with changes to other fields (for example, `occurredAt`, `correlationId`, or `description`) may be accepted as a duplicate. Add a canonical payload hash (or equivalent immutable event snapshot) and compare it on every replay, including the concurrent-insert recovery path.
- **Concurrent payment-reference conflict:** the database uniqueness constraint is the final protection against concurrent imports. Add a regression test where two different event IDs race for the same owner/payment reference; only one import may be committed and the losing request must return HTTP 409.
- **Migration verification:** run the full Alembic upgrade chain against an ephemeral PostgreSQL database, verify the resulting constraints/indexes, and test downgrade behavior in a disposable database. Do not run downgrade against production data.
- **CI evidence:** PR #34's GitHub Actions runs must be green before merge. A failed run without accessible logs is unresolved, not a pass. Re-run after the root cause is identified.
- **End-to-end verification:** validate service authentication, owner/account mapping, confirmed payment ingestion, duplicate delivery, conflicting replay, and database persistence using a non-production Gestão/Finance environment.

These are verification and implementation requirements, not claims that the above tests have already passed. PR #31 remains out of scope. No merge or deployment is authorized by this checklist.
