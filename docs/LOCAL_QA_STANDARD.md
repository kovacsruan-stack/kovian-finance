# Local QA Standard

## Required validation

Before considering a frontend change complete:

1. Start the local application and verify the health/runtime endpoint.
2. Open the application with the local browser QA integration.
3. Verify the initial shell renders without a blank/black screen.
4. Verify PT-BR and EN language switching.
5. Verify navigation, primary actions, forms and error states.
6. For changes affecting data, verify loading, success, empty and failure states.
7. Run the frontend unit suite and production build.
8. Run Playwright E2E coverage for the affected flow.
9. Run `git diff --check` before committing.

## UX rule

End-user screens stay simple. Operational configuration, provider credentials, retry policies, budgets and infrastructure controls belong in backend/runtime configuration whenever possible.

## Regression rule

A browser regression found locally must be reproduced in an automated test when practical. Prefer stable semantic selectors and accessible labels over CSS implementation details.

## Ecosystem rule

KOVI AI, KOVIAN Finance and KOVIAN Fitness share the same QA expectations while retaining their domain-specific workflows.
