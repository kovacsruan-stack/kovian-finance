# KOVIAN Finance local development

The repository includes a standalone Docker stack and a dedicated Vite port so Finance can run beside Fitness without host-port collisions. Local validation is auxiliary to the hosted online QA gate.

## Services

| Service | URL |
| --- | --- |
| Finance API | http://localhost:8082 |
| Health | http://localhost:8082/actuator/health |
| Swagger | http://localhost:8082/swagger-ui.html |
| PostgreSQL | localhost:55434 |
| Redis | localhost:56381 |
| Frontend | http://localhost:5174 |

## Backend

```powershell
docker compose -f docker-compose.local.yml up -d --build
```

The local image builds with Maven 3.9.12 directly because the repository does not currently include a Maven Wrapper.

## Frontend

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

The Vite proxy target defaults to `http://localhost:8082` and can be overridden with `VITE_API_PROXY_TARGET`. Keep the frontend bound to `0.0.0.0` when testing from a phone on the same Wi-Fi; `127.0.0.1` only exposes it to the PC itself.

### Workstation health validation

After startup, verify:

```text
http://localhost:8082/actuator/health
```

A healthy HTTP response confirms reachability only; it is not a substitute for the project's full test suite or end-to-end validation.

## Online-first QA

Hosted deployments, public healthchecks, HTTP/API behavior and runtime logs are the primary validation evidence. Local development is an auxiliary diagnostic environment. Browser/Opera QA should be used selectively and in batched sessions because browser usage is a limited resource.

For the current cross-chat state and deployment blockers, read `docs/KOVIAN_ECOSYSTEM_HANDOFF.md`.

## Unified KOVIAN workstation

For running KOVI AI, KOVIAN Fitness and KOVIAN Finance together, use the launcher in the `kovi-ai` repository. The Finance frontend is exposed on port 5174 and the API on 8082. The launcher also injects the PC IPv4 into the local CORS allowlist for mobile testing on the same Wi-Fi network.

Health/readiness endpoints:

- `/actuator/health`
- `/actuator/health/liveness`
- `/actuator/health/readiness`
