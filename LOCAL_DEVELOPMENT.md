# KOVIAN Finance local development

The repository includes a standalone Docker stack and a dedicated Vite port so Finance can run beside Fitness without host-port collisions.

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
npm run dev -- --host 127.0.0.1 --port 5174
```

The Vite proxy target is `http://localhost:8082` and can be overridden with `VITE_API_PROXY_TARGET`.


### Workstation health validation

After startup, verify:

```text
http://localhost:8082/actuator/health
```

A healthy HTTP response confirms reachability only; it is not a substitute for the project's full test suite or end-to-end validation.
