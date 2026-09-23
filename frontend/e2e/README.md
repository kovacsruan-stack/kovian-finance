# Local browser QA

Run the Finance frontend/API locally, then:

```powershell
cd frontend
npm run test:e2e
```

Override the browser target with `KOVIAN_FINANCE_QA_BASE_URL` when needed.

The smoke suite starts with shell rendering, uncaught browser errors, and PT-BR/EN switching before deeper domain flows are exercised.
