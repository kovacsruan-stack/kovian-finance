# KOVI Intelligence Operations

KOVI consumes Finance through explicit, bounded context contracts.

## Source ownership

Finance remains authoritative for accounts, transactions, revenue, cash flow, risk and forecasts. KOVI may reason over authorized context but cannot mutate Finance through the intelligence boundary.

## Intelligence primitives

- bounded financial forecasting
- side-effect-free scenario simulation
- anomaly detection
- notification governance
- context sanitization

## Operational rules

1. Tenant identity must match exactly.
2. Context is bounded before federation.
3. AI suggestions are not financial source-of-truth mutations.
4. Forecasts and scenarios must remain explainable and deterministic at the domain layer.
5. Production mutation requires a separate governed domain action and explicit authorization.
