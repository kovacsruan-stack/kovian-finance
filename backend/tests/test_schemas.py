from datetime import date
from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.schemas import LedgerEntryCreate


def test_valid_financial_entry():
    item = LedgerEntryCreate(
        description="Studio mensalidade", amount=Decimal("250.00"),
        entry_type="income", currency="BRL", category="mensalidade",
        due_date=date(2026, 10, 1), account_id="account-1"
    )
    assert item.amount == Decimal("250.00")


def test_amount_must_be_positive():
    with pytest.raises(ValidationError):
        LedgerEntryCreate(description="Invalid", amount=Decimal("0"), entry_type="expense",
                          currency="BRL", category="other", account_id="account-1")


def test_entry_rejects_unknown_fields():
    with pytest.raises(ValidationError):
        LedgerEntryCreate(description="Invalid", amount=Decimal("1"), entry_type="expense",
                          currency="BRL", category="other", account_id="account-1",
                          admin=True)
