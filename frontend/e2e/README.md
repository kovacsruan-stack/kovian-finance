# Local browser QA

Run the Finance frontend/API locally, then:

```powershell
cd frontend
npm run qa:chromium
```

The suite can start/reuse the Vite frontend automatically.

Coverage includes:
- shell and all primary finance routes;
- search palette and Escape handling;
- PT-BR/EN switching;
- uncaught browser errors;
- untranslated-key regressions;
- mobile horizontal overflow.
