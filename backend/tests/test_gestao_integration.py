import pytest
from pydantic import ValidationError

from app.gestao_integration import PaymentPayload


def valid_event():
    return {
        "id": "2f1c7d35-7e1f-4d64-a6a0-4bb3a2f72a10",
        "type": "MANAGEMENT_PAYMENT_PAID.v1",
        "version": 1,
        "ownerId": "d2b3e2d8-4b8a-4d6d-9c41-42b9a1a01c51",
        "occurredAt": "2026-09-28T12:00:00Z",
        "correlationId": "2f1c7d35-7e1f-4d64-a6a0-4bb3a2f72a10",
        "payload": {
            "paymentRef": "payment-123",
            "studentRef": "student-456",
            "amountMinor": 12500,
            "currency": "BRL",
            "paidAt": "2026-09-28T12:00:00Z",
            "description": "Mensalidade KOVIAN Gestão",
        },
    }


def test_gestao_payment_event_accepts_supported_version():
    event = PaymentPayload.model_validate(valid_event())
    assert event.version == 1
    assert event.type == "MANAGEMENT_PAYMENT_PAID.v1"
    assert event.payload.amountMinor == 12500


def test_gestao_payment_event_rejects_unknown_top_level_fields():
    data = valid_event()
    data["unexpected"] = "must not be silently accepted"
    with pytest.raises(ValidationError):
        PaymentPayload.model_validate(data)


def test_gestao_payment_event_rejects_unsupported_version():
    data = valid_event()
    data["version"] = 2
    with pytest.raises(ValidationError):
        PaymentPayload.model_validate(data)


def test_gestao_payment_event_rejects_wrong_event_type():
    data = valid_event()
    data["type"] = "PAYMENT.v2"
    with pytest.raises(ValidationError):
        PaymentPayload.model_validate(data)



from types import SimpleNamespace
from fastapi.testclient import TestClient
from app.database import get_session
from app.main import app
from app.models import Account, Transaction


class FakeSession:
    def __init__(self):
        self.accounts = {
            "account-1": SimpleNamespace(
                id="account-1", user_id="d2b3e2d8-4b8a-4d6d-9c41-42b9a1a01c51",
                currency="BRL", is_active=True,
            )
        }
        self.transactions = {}
        self.pending = None

    async def scalar(self, statement):
        entity = statement.column_descriptions[0]["entity"]
        if entity is Account:
            return self.accounts["account-1"]
        if entity is Transaction:
            # The integration uses the event ID as the transaction primary key.
            return self.transactions.get("2f1c7d35-7e1f-4d64-a6a0-4bb3a2f72a10")
        return None

    def add(self, item):
        self.pending = item

    async def commit(self):
        if self.pending is not None:
            self.transactions[self.pending.id] = self.pending
            self.pending = None

    async def rollback(self):
        self.pending = None


@pytest.fixture
def integration_client(monkeypatch):
    monkeypatch.setenv("KOVIAN_FINANCE_INTEGRATION_TOKEN", "test-integration-token-with-32-chars-min")
    monkeypatch.setenv("KOVIAN_FINANCE_OWNER_ID", "d2b3e2d8-4b8a-4d6d-9c41-42b9a1a01c51")
    session = FakeSession()

    async def override_session():
        yield session

    app.dependency_overrides[get_session] = override_session
    try:
        yield TestClient(app), session
    finally:
        app.dependency_overrides.pop(get_session, None)


def test_gestao_payment_ingestion_is_idempotent(integration_client):
    client, session = integration_client
    headers = {"Authorization": "Bearer test-integration-token-with-32-chars-min"}
    event = valid_event()
    url = "/api/v1/integrations/gestao/payments?account_id=account-1"

    first = client.post(url, json=event, headers=headers)
    second = client.post(url, json=event, headers=headers)

    assert first.status_code == 201
    assert first.json()["transaction"]["id"] == event["id"]
    assert first.json()["duplicate"] is False
    assert second.status_code == 201
    assert second.json()["duplicate"] is True
    assert len(session.transactions) == 1


def test_gestao_payment_ingestion_rejects_invalid_token(integration_client):
    client, _ = integration_client
    response = client.post(
        "/api/v1/integrations/gestao/payments?account_id=account-1",
        json=valid_event(),
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert response.status_code == 401

def test_gestao_payment_event_rejects_missing_payment_reference():
    data = valid_event()
    del data["payload"]["paymentRef"]
    with pytest.raises(ValidationError):
        PaymentPayload.model_validate(data)


def test_gestao_payment_event_rejects_unknown_nested_fields():
    data = valid_event()
    data["payload"]["internalNote"] = "must not be accepted"
    with pytest.raises(ValidationError):
        PaymentPayload.model_validate(data)


def test_gestao_payment_event_rejects_timezone_naive_timestamps():
    data = valid_event()
    data["occurredAt"] = "2026-09-28T12:00:00"
    with pytest.raises(ValidationError):
        PaymentPayload.model_validate(data)

    data = valid_event()
    data["payload"]["paidAt"] = "2026-09-28T12:00:00"
    with pytest.raises(ValidationError):
        PaymentPayload.model_validate(data)


def test_gestao_payment_event_allows_optional_description():
    data = valid_event()
    del data["payload"]["description"]
    event = PaymentPayload.model_validate(data)
    assert event.payload.description == "Mensalidade"

