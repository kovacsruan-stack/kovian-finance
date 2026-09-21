# KOVI AI Integration

KOVIAN Finance is the source of truth for financial state.

KOVI AI receives governed, read-only context through /api/v1/internal/kovi/* using the dedicated internal credential.

External automation through n8n must never mutate Finance data directly. A future financial mutation must pass through a Finance-owned API, authorization, idempotency and audit controls.

Representative signals:
- transaction.created
- transaction.cancelled
- payment.received
- cash_flow.risk
- goal.deadline
- recurring.due

The KOVI integration runtime is responsible for external messaging, calendar and workflow execution.


## Internal security
The KOVI internal API is protected centrally by the Spring Security chain with a timing-safe credential filter, while controller-level checks remain as defense in depth. Metrics track authenticated internal traffic and rejected credentials.
