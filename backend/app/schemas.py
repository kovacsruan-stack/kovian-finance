"""Validated request contracts for financial records."""
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class LedgerEntryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    entry_type: str = Field(pattern="^(income|expense|transfer)$")
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")
    category: str = Field(min_length=1, max_length=100)
    due_date: date | None = None
    account_id: str = Field(min_length=1, max_length=100)
    is_recurring: bool = False
