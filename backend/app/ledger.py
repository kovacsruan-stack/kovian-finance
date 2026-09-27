"""Decimal-based financial domain helpers; amounts are never represented as floats."""
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum


class EntryType(StrEnum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


@dataclass(frozen=True, slots=True)
class LedgerEntry:
    amount: Decimal
    entry_type: EntryType
    currency: str
    category: str
    is_confirmed: bool = False

    def __post_init__(self) -> None:
        if not self.amount.is_finite() or self.amount <= 0:
            raise ValueError("Amount must be a finite positive decimal")
        if len(self.currency) != 3 or not self.currency.isalpha():
            raise ValueError("Currency must be a three-letter code")
        if not self.category.strip():
            raise ValueError("Category is required")


def net_cash_flow(entries: list[LedgerEntry], currency: str) -> Decimal:
    """Sum confirmed income minus confirmed expenses for one currency.

    Transfers are excluded to avoid double-counting movement between owned accounts.
    """
    total = Decimal("0")
    for entry in entries:
        if not entry.is_confirmed or entry.currency.upper() != currency.upper():
            continue
        if entry.entry_type == EntryType.INCOME:
            total += entry.amount
        elif entry.entry_type == EntryType.EXPENSE:
            total -= entry.amount
    return total
