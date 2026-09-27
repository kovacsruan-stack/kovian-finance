"""Owner-scoped account and ledger API."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .ledger import EntryType, LedgerEntry, net_cash_flow
from .models import Account, Transaction
from .schemas import LedgerEntryCreate
from .security import decode_access_token

router = APIRouter(prefix="/api/v1", tags=["finance"])
_bearer = HTTPBearer(auto_error=False)


class AccountCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    account_type: str = Field(min_length=1, max_length=30)
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")
    opening_balance: Decimal = Field(default=Decimal("0"), max_digits=14, decimal_places=2)


async def _user_id(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer token required")
    try:
        claims = decode_access_token(credentials.credentials)
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from None
    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    return subject


@router.get("/accounts")
async def list_accounts(user_id: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> list[dict]:
    rows = (await session.scalars(select(Account).where(Account.owner_id == user_id, Account.is_active.is_(True)).order_by(Account.created_at.desc()))).all()
    return [{"id": row.id, "name": row.name, "account_type": row.account_type, "currency": row.currency, "opening_balance": row.opening_balance, "is_active": row.is_active, "created_at": row.created_at} for row in rows]


@router.post("/accounts")
async def create_account(body: AccountCreate, user_id: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> dict:
    row = Account(id=str(uuid.uuid4()), owner_id=user_id, name=body.name.strip(), account_type=body.account_type, currency=body.currency, opening_balance=body.opening_balance, is_active=True, created_at=datetime.now(timezone.utc))
    session.add(row)
    await session.commit()
    return {"id": row.id, "name": row.name, "account_type": row.account_type, "currency": row.currency, "opening_balance": row.opening_balance, "is_active": row.is_active}


@router.get("/transactions")
async def list_transactions(user_id: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> list[dict]:
    rows = (await session.execute(select(Transaction).join(Account, Transaction.account_id == Account.id).where(Account.owner_id == user_id).order_by(Transaction.created_at.desc()).limit(500))).scalars().all()
    return [{"id": row.id, "account_id": row.account_id, "description": row.description, "amount": row.amount, "entry_type": row.entry_type, "currency": row.currency, "category": row.category, "due_date": row.due_date, "paid_at": row.paid_at, "is_confirmed": row.is_confirmed, "recurrence_rule": row.recurrence_rule, "created_at": row.created_at} for row in rows]


@router.post("/transactions")
async def create_transaction(body: LedgerEntryCreate, user_id: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> dict:
    account = await session.scalar(select(Account).where(Account.id == body.account_id, Account.owner_id == user_id, Account.is_active.is_(True)))
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    try:
        entry = LedgerEntry(amount=body.amount, entry_type=EntryType(body.entry_type), currency=body.currency, category=body.category, is_confirmed=False)
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Invalid ledger entry") from None
    row = Transaction(id=str(uuid.uuid4()), account_id=account.id, description=body.description.strip(), amount=entry.amount, entry_type=entry.entry_type.value, currency=entry.currency, category=entry.category.strip(), due_date=body.due_date, paid_at=None, is_confirmed=False, recurrence_rule="monthly" if body.is_recurring else None, created_at=datetime.now(timezone.utc))
    session.add(row)
    await session.commit()
    return {"id": row.id, "account_id": row.account_id, "description": row.description, "amount": row.amount, "entry_type": row.entry_type, "currency": row.currency, "category": row.category, "due_date": row.due_date, "is_confirmed": row.is_confirmed, "created_at": row.created_at}


@router.get("/ledger/summary")
async def ledger_summary(user_id: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> dict:
    rows = (await session.execute(select(Transaction).join(Account, Transaction.account_id == Account.id).where(Account.owner_id == user_id))).scalars().all()
    currencies = sorted({row.currency for row in rows})
    totals = {}
    for currency in currencies:
        entries = [LedgerEntry(amount=row.amount, entry_type=EntryType(row.entry_type), currency=row.currency, category=row.category, is_confirmed=row.is_confirmed) for row in rows]
        totals[currency] = str(net_cash_flow(entries, currency))
    return {"confirmed_net_cash_flow": totals, "transaction_count": len(rows), "pending_count": sum(not row.is_confirmed for row in rows)}
