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
    assert event.payload["amountMinor"] == 12500


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
