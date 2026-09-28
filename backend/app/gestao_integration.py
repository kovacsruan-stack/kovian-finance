"""Server-to-server event ingestion for KOVIAN Gestão."""
import hmac
import os
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import Account, Transaction

router = APIRouter(prefix="/api/v1/integrations/gestao", tags=["Gestão integration"])


class PaymentDetails(BaseModel):
    model_config = ConfigDict(extra="forbid")
    paymentRef: str = Field(min_length=1, max_length=128)
    studentRef: str = Field(min_length=1, max_length=128)
    amountMinor: int = Field(gt=0, le=99999999999999)
    currency: str = Field(pattern="^[A-Z]{3}$")
    paidAt: datetime
    description: str = Field(default="Mensalidade", max_length=160)

    @field_validator("paidAt")
    @classmethod
    def paid_at_must_have_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("paidAt must include a timezone")
        return value


class PaymentPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern="^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")
    type: str = Field(pattern="^MANAGEMENT_PAYMENT_PAID[.]v1$")
    version: int = Field(ge=1, le=1)
    ownerId: str = Field(pattern="^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")
    occurredAt: datetime
    correlationId: str | None = Field(default=None, min_length=1, max_length=100)
    payload: PaymentDetails

    @field_validator("occurredAt")
    @classmethod
    def occurred_at_must_have_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("occurredAt must include a timezone")
        return value


@router.post("/payments", status_code=201)
async def ingest_payment(
    body: PaymentPayload,
    account_id: str = Query(min_length=1, max_length=36),
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_session),
):
    expected_token = os.getenv("KOVIAN_FINANCE_INTEGRATION_TOKEN", "")
    expected_owner = os.getenv("KOVIAN_FINANCE_OWNER_ID", "")
    if len(expected_token) < 32 or not expected_owner:
        raise HTTPException(status_code=503, detail="Gestão integration is not configured")
    scheme, _, supplied = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not supplied or not hmac.compare_digest(supplied, expected_token):
        raise HTTPException(status_code=401, detail="Invalid integration credentials")
    if body.ownerId != expected_owner or (body.correlationId is not None and body.correlationId != body.id):
        raise HTTPException(status_code=403, detail="Integration identity mismatch")

    data = body.payload
    paid_at = data.paidAt
    currency = data.currency
    description = data.description.strip() or "Mensalidade"
    if not description:
        description = "Mensalidade"

    account = await db.scalar(select(Account).where(
        Account.id == account_id,
        Account.user_id == expected_owner,
        Account.is_active.is_(True),
    ))
    if account is None:
        raise HTTPException(status_code=404, detail="Active Finance account not found")
    if account.currency != currency:
        raise HTTPException(status_code=422, detail="Currency does not match Finance account")

    amount = (Decimal(data.amountMinor) / Decimal(100)).quantize(Decimal("0.01"))
    existing = await db.scalar(select(Transaction).where(Transaction.id == body.id))
    if existing is not None:
        if (existing.user_id, existing.account_id, existing.amount, existing.entry_type, existing.currency) != (
            expected_owner, account.id, amount, "income", currency
        ):
            raise HTTPException(status_code=409, detail="Event ID conflicts with an existing transaction")
        return {"status": "synced", "transaction": {"id": existing.id}, "duplicate": True, "eventId": body.id}

    transaction = Transaction(
        id=body.id, user_id=expected_owner, account_id=account.id,
        description=description[:200], amount=amount, entry_type="income",
        currency=currency, category="Mensalidades", due_date=paid_at.date(),
        paid_at=paid_at, is_confirmed=True, created_at=datetime.now(timezone.utc),
    )
    db.add(transaction)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        existing = await db.scalar(select(Transaction).where(Transaction.id == body.id))
        if existing is not None and (existing.user_id, existing.account_id, existing.amount, existing.entry_type, existing.currency) == (
            expected_owner, account.id, amount, "income", currency
        ):
            return {"status": "synced", "transaction": {"id": existing.id}, "duplicate": True, "eventId": body.id}
        raise HTTPException(status_code=409, detail="Payment event could not be processed safely")
    return {"status": "synced", "transaction": {"id": transaction.id}, "duplicate": False, "eventId": body.id}
