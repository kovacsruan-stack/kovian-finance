from decimal import Decimal
import pytest

from app.ledger import EntryType, LedgerEntry, net_cash_flow


def entry(amount, kind, *, currency="BRL", confirmed=True):
    return LedgerEntry(Decimal(amount), kind, currency, "general", confirmed)


def test_cash_flow_uses_confirmed_income_and_expenses():
    entries = [entry("1500.00", EntryType.INCOME), entry("300.25", EntryType.EXPENSE),
               entry("999.00", EntryType.INCOME, confirmed=False)]
    assert net_cash_flow(entries, "BRL") == Decimal("1199.75")


def test_cash_flow_does_not_mix_currencies():
    entries = [entry("100", EntryType.INCOME), entry("50", EntryType.EXPENSE, currency="EUR")]
    assert net_cash_flow(entries, "BRL") == Decimal("100")


def test_transfer_is_excluded_from_cash_flow():
    assert net_cash_flow([entry("100", EntryType.TRANSFER)], "BRL") == Decimal("0")


def test_negative_amount_is_rejected():
    with pytest.raises(ValueError, match="positive"):
        entry("-1", EntryType.EXPENSE)


def test_currency_must_be_three_letters():
    with pytest.raises(ValueError, match="three-letter"):
        LedgerEntry(Decimal("1"), EntryType.INCOME, "R$", "salary")
