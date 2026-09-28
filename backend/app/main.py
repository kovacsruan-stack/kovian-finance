import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth_routes import router as auth_router
from .finance_routes import router as finance_router
from .integration_routes import router as integration_router
from .planning_routes import router as planning_router

app = FastAPI(
    title="KOVIAN Finance API",
    version="0.1.0",
    description="Personal and business finance management.",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(finance_router)
app.include_router(integration_router)
app.include_router(planning_router)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "kovian-finance-api", "version": app.version}


@app.get("/api/v1", tags=["operations"])
def api_info() -> dict[str, str]:
    return {"service": "KOVIAN Finance", "api_version": "v1", "status": "foundation"}
