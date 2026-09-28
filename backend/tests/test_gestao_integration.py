import asyncio
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.integration_routes import PaymentEvent, _require_aware, import_gestao_payment
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
        {"paymentRef": "   "},
        {"studentRef": "  "},
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



def test_payment_import_creates_one_confirmed_income_transaction():
    user_id = str(uuid4())
    account_id = str(uuid4())
    event_data = valid_event()
    event_data["ownerId"] = user_id
    event = PaymentEvent.model_validate(event_data)
    account = SimpleNamespace(id=account_id, currency="BRL")
    db = Mock()
    db.scalar = AsyncMock(side_effect=[None, None, account])
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.add_all = Mock()
    response = SimpleNamespace(status_code=201)

    result = asyncio.run(
        import_gestao_payment(
            event=event,
            response=response,
            account_id=account_id,
            user_id=user_id,
            db=db,
        )
    )

    assert result["duplicate"] is False
    assert result["transaction"]["amount"] == "125.00"
    assert result["transaction"]["entry_type"] == "income"
    assert result["transaction"]["is_confirmed"] is True
    assert db.add_all.call_count == 1
    added = db.add_all.call_args.args[0]
    assert len(added) == 2
    assert added[0].amount == Decimal("125")
    assert added[0].user_id == user_id
    assert added[1].event_id == str(event.id)
    db.commit.assert_awaited_once()


def test_payment_import_rejects_owner_mismatch_before_database_write():
    event = PaymentEvent.model_validate(valid_event())
    db = Mock()
    db.scalar = AsyncMock()
    response = SimpleNamespace(status_code=201)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            import_gestao_payment(
                event=event,
                response=response,
                account_id=str(uuid4()),
                auth={"mode": "user", "user_id": str(uuid4())},
                db=db,
            )
        )

    assert exc.value.status_code == 403
    db.scalar.assert_not_awaited()
    db.commit.assert_not_called()


def test_payment_import_returns_existing_transaction_for_same_event():
    user_id = str(uuid4())
    account_id = str(uuid4())
    event_data = valid_event()
    event_data["ownerId"] = user_id
    event = PaymentEvent.model_validate(event_data)
    imported = SimpleNamespace(
        transaction_id=str(uuid4()),
        payment_ref=event.payload.paymentRef,
        student_ref=event.payload.studentRef,
    )
    transaction = SimpleNamespace(
        id=imported.transaction_id,
        user_id=user_id,
        account_id=account_id,
        amount=Decimal("125.00"),
        paid_at=event.payload.paidAt,
        currency="BRL",
        entry_type="income",
        category="Mensalidades",
        is_confirmed=True,
    )
    db = Mock()
    db.scalar = AsyncMock(side_effect=[imported, transaction])
    response = SimpleNamespace(status_code=201)

    result = asyncio.run(
        import_gestao_payment(
            event=event,
            response=response,
            account_id=account_id,
            user_id=user_id,
            db=db,
        )
    )

    assert result["duplicate"] is True
    assert result["transaction"]["id"] == transaction.id
    assert response.status_code == 200
    db.commit.assert_not_called()
