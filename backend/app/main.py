from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="KOVIAN Finance API",
    version="0.1.0",
    description="Personal and business finance management API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],  # Configure explicit frontend origins through environment settings.
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "kovian-finance-api", "version": app.version}


@app.get("/api/v1", tags=["operations"])
def api_info() -> dict[str, str]:
    return {"service": "KOVIAN Finance", "api_version": "v1", "status": "foundation"}
