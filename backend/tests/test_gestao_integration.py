from datetime import datetime, timezone
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.integration_routes import PaymentEvent, _require_aware
from fastapi import HTTPException


def valid_event(**overrides):
    data = {
        "id": str(uuid4()),
        "type": "MANAGEMENT_PAYMENT_PAID.v1",
        "version": 1,
        "ownerId": str(uuid4()),
        "occurredAt": "2026-09-28T12:00:00Z",
        "payload": {
            "paymentRef": "payment-123",
            "studentRef": "student-456",
            "amountMinor": 12500,
            "currency": "BRL",
            "paidAt": "2026-09-28T11:59:00Z",
            "description": "Mensalidade",
        },
    }
    data.update(overrides)
    return data


def test_gestao_payment_event_accepts_contract_shape():
    event = PaymentEvent.model_validate(valid_event())
    assert event.payload.amountMinor == 12500
    assert event.payload.currency == "BRL"


@pytest.mark.parametrize(
    "payload_change",
    [
        {"amountMinor": 0},
        {"amountMinor": -1},
        {"currency": "R$"},
        {"paymentRef": ""},
        {"unexpected": "personal data"},
    ],
)
def test_gestao_payment_event_rejects_invalid_payload(payload_change):
    data = valid_event()
    data["payload"].update(payload_change)
    with pytest.raises(ValidationError):
        PaymentEvent.model_validate(data)


def test_gestao_payment_event_rejects_unknown_top_level_fields():
    data = valid_event()
    data["studentName"] = "Must not be accepted"
    with pytest.raises(ValidationError):
        PaymentEvent.model_validate(data)


def test_timezone_is_required_for_event_timestamps():
    with pytest.raises(HTTPException) as exc:
        _require_aware(datetime(2026, 9, 28, 12, 0), "paidAt")
    assert exc.value.status_code == 422


def test_timezone_aware_timestamp_is_accepted():
    _require_aware(datetime(2026, 9, 28, 12, 0, tzinfo=timezone.utc), "paidAt")
