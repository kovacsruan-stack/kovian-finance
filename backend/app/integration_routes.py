"""Secure, idempotent ingestion endpoint for confirmed KOVIAN Gestão payments.

The endpoint requires a Finance user token. Cross-product service credentials and
canonical identity mapping must be added before allowing unattended server-to-server
delivery from Gestão.
"""
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .finance_routes import current_user
from .models import Account, GestaoPaymentImport, Transaction

router = APIRouter(prefix="/api/v1/integrations/gestao", tags=["integrations"])


class PaymentPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    paymentRef: str = Field(min_length=1, max_length=128)
    studentRef: str = Field(min_length=1, max_length=128)
    amountMinor: int = Field(gt=0)
    currency: str = Field(pattern="^[A-Z]{3}$")
    paidAt: datetime
    description: str | None = Field(default=None, max_length=160)


class PaymentEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    type: str = Field(pattern="^MANAGEMENT_PAYMENT_PAID[.]v1$")
    version: int = Field(ge=1, le=1)
    ownerId: UUID
    occurredAt: datetime
    correlationId: str | None = Field(default=None, max_length=100)
    payload: PaymentPayload


def _require_aware(value: datetime, field: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise HTTPException(status_code=422, detail=f"{field} must include a timezone")


def _transaction_response(transaction: Transaction, *, duplicate: bool) -> dict:
    return {
        "transaction": {
            "id": transaction.id,
            "account_id": transaction.account_id,
            "amount": str(transaction.amount),
            "currency": transaction.currency,
            "entry_type": transaction.entry_type,
            "category": transaction.category,
            "is_confirmed": transaction.is_confirmed,
            "paid_at": transaction.paid_at,
        },
        "duplicate": duplicate,
    }


@router.post("/payments", status_code=201)
async def import_gestao_payment(
    event: PaymentEvent,
    account_id: str = Query(min_length=1, max_length=36),
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    """Import one confirmed payment; repeated deliveries never create another entry."""
    _require_aware(event.occurredAt, "occurredAt")
    _require_aware(event.payload.paidAt, "payload.paidAt")

    if str(event.ownerId) != user_id:
        raise HTTPException(status_code=403, detail="Event owner does not match authenticated user")
    if event.payload.currency != "BRL":
        raise HTTPException(status_code=422, detail="Only BRL Gestão payments are supported")

    existing = await db.scalar(
        select(GestaoPaymentImport).where(
            GestaoPaymentImport.user_id == user_id,
            GestaoPaymentImport.event_id == str(event.id),
        )
    )
    if existing is not None:
        transaction = await db.scalar(
            select(Transaction).where(
                Transaction.id == existing.transaction_id,
                Transaction.user_id == user_id,
            )
        )
        if transaction is None:
            raise HTTPException(status_code=409, detail="Imported event has no ledger transaction")
        expected_amount = Decimal(event.payload.amountMinor) / Decimal(100)
        if (
            existing.payment_ref != event.payload.paymentRef
            or existing.student_ref != event.payload.studentRef
            or transaction.amount != expected_amount
            or transaction.account_id != account_id
            or transaction.paid_at != event.payload.paidAt
        ):
            raise HTTPException(status_code=409, detail="Event ID was reused with a different payload")
        return _transaction_response(transaction, duplicate=True)

    prior_payment = await db.scalar(
        select(GestaoPaymentImport).where(
            GestaoPaymentImport.user_id == user_id,
            GestaoPaymentImport.payment_ref == event.payload.paymentRef,
        )
    )
    if prior_payment is not None:
        raise HTTPException(status_code=409, detail="Payment reference has already been imported")

    account = await db.scalar(
        select(Account).where(
            Account.id == account_id,
            Account.user_id == user_id,
            Account.is_active.is_(True),
        )
    )
    if account is None:
        raise HTTPException(status_code=404, detail="Active account not found")
    if account.currency != event.payload.currency:
        raise HTTPException(status_code=422, detail="Payment currency must match account currency")

    amount = Decimal(event.payload.amountMinor) / Decimal(100)
    description = (event.payload.description or "Mensalidade KOVIAN Gestão").strip()
    transaction = Transaction(
        id=str(uuid4()),
        user_id=user_id,
        account_id=account.id,
        description=description[:200],
        amount=amount,
        entry_type="income",
        currency=event.payload.currency,
        category="Mensalidades",
        due_date=None,
        paid_at=event.payload.paidAt,
        is_confirmed=True,
        recurrence_rule=None,
        created_at=datetime.now(timezone.utc),
    )
    imported = GestaoPaymentImport(
        id=str(uuid4()),
        user_id=user_id,
        event_id=str(event.id),
        payment_ref=event.payload.paymentRef,
        student_ref=event.payload.studentRef,
        transaction_id=transaction.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add_all([transaction, imported])
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # A concurrent retry may have won the unique constraint. Return that
        # result only when it is the same event; otherwise report a conflict.
        winner = await db.scalar(
            select(GestaoPaymentImport).where(
                GestaoPaymentImport.user_id == user_id,
                GestaoPaymentImport.event_id == str(event.id),
            )
        )
        if winner is not None:
            winner_transaction = await db.scalar(
                select(Transaction).where(
                    Transaction.id == winner.transaction_id,
                    Transaction.user_id == user_id,
                )
            )
            if winner_transaction is not None:
                return _transaction_response(winner_transaction, duplicate=True)
        raise HTTPException(status_code=409, detail="Payment event conflicts with an existing import")
    await db.refresh(transaction)
    return _transaction_response(transaction, duplicate=False)
