# KOVIAN Integration

KOVIAN Finance remains the source of truth for financial-domain facts.

## Identity
Finance consumes the canonical ecosystem subject identifier while retaining ownership of financial accounts, transactions and ledger state.

## Analytics
Finance emits governed events using schema kovian.event.v1. Events are tenant-scoped, minimized and purpose-bound. Analytics does not become the source of truth for ledger facts.

## KOVI AI
KOVI AI receives read-only governed context through the Finance integration contract. Financial mutations remain Finance-owned.

## Deletion
Subject deletion marks derived analytics records for deletion. Retention cleanup permanently removes only records that are both deleted and outside the retention window.
