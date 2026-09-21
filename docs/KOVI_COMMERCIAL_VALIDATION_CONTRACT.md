# KOVI Commercial Validation Contract

This domain remains authoritative for its own data and business rules while exposing governed read/context capabilities to KOVI AI.

## Validation gates
- compile/build
- unit tests
- integration tests
- security/authentication
- tenant/workspace isolation
- database migration integrity
- API contract checks
- health/smoke checks
- observability checks
- KOVI federation contract checks where enabled

## Delivery rule
KOVI must not bypass domain services or write directly to domain-owned persistence. A green application build does not override domain safety or authorization failures.

## Evidence
Every release candidate should retain commit/version, test run, migration state, security result, API contract result, health result and unresolved limitations.

## Commercial builder integration
KOVI may inspect and orchestrate against the domain through explicit contracts. Production mutations remain domain-owned and governed.

## Local validation
The final full validation suite is executed locally on the operator PC after implementation. Implementation percentages are independent from test completion.
