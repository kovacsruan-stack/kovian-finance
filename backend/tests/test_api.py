from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_reports_service_and_version():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "kovian-finance-api",
        "version": app.version,
    }


def test_versioned_api_info_is_available():
    response = client.get("/api/v1")

    assert response.status_code == 200
    assert response.json() == {
        "service": "KOVIAN Finance",
        "api_version": "v1",
        "status": "foundation",
    }


def test_management_endpoints_are_registered():
    paths = {route.path for route in app.routes}
    assert "/api/v1/management/{resource}" in paths
    assert "/api/v1/management/{resource}/{record_id}" in paths
    assert "/api/v1/management/import-batch/{resource}" in paths
