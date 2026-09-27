import pytest
from pydantic import ValidationError

from app.schemas import LedgerEntryCreate


def valid_entry(**overrides):
    data = {
        "description": "Monthly rent",
        "amount": "1250.00",
        "entry_type": "expense",
        "currency": "BRL",
        "category": "Housing",
        "account_id": "account-1",
    }
    data.update(overrides)
    return data


def test_amount_must_be_positive():
    with pytest.raises(ValidationError):
        LedgerEntryCreate(**valid_entry(amount="0.00"))


def test_amount_rejects_more_than_two_decimal_places():
    with pytest.raises(ValidationError):
        LedgerEntryCreate(**valid_entry(amount="10.123"))


def test_currency_must_be_three_uppercase_letters():
    with pytest.raises(ValidationError):
        LedgerEntryCreate(**valid_entry(currency="brl"))


def test_entry_type_is_restricted():
    with pytest.raises(ValidationError):
        LedgerEntryCreate(**valid_entry(entry_type="refund"))


def test_unknown_fields_are_rejected():
    with pytest.raises(ValidationError):
        LedgerEntryCreate(**valid_entry(is_admin=True))
