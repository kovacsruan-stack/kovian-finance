from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_reports_service_status() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "kovian-finance-api"


def test_api_info_is_versioned() -> None:
    response = client.get("/api/v1")
    assert response.status_code == 200
    assert response.json()["api_version"] == "v1"
