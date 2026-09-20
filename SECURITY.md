# Security Policy

## Reporting
Do not publish credentials, tokens, personal data or exploitable proof-of-concept details in public issues. Report security concerns privately to the repository maintainers.

## Baseline
- Secrets must remain outside source control.
- Production credentials must be scoped and rotated.
- Authentication and authorization are mandatory at domain boundaries.
- Mutating operations require explicit ownership and audit evidence.
- Dependencies and CI workflows must be reviewed regularly.
- Personal data must be minimized, access-controlled and deleted according to retention policy.
