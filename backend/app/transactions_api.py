"""Owner-scoped transaction endpoints and account summaries."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import Account, Transaction
from .security import decode_access_token

router = APIRouter(prefix="/api/v1", tags=["transactions"])
_bearer = HTTPBearer(auto_error=False)


class TransactionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    account_id: str = Field(min_length=1, max_length=36)
    description: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    entry_type: str = Field(pattern="^(income|expense)$")
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")
    category: str = Field(min_length=1, max_length=100)
    due_date: date | None = None
    is_confirmed: bool = False


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


def _serialize(row: Transaction) -> dict:
    return {"id": row.id, "account_id": row.account_id, "description": row.description, "amount": str(row.amount), "entry_type": row.entry_type, "currency": row.currency, "category": row.category, "due_date": row.due_date, "paid_at": row.paid_at, "is_confirmed": row.is_confirmed, "created_at": row.created_at}


@router.get("/transactions")
async def list_transactions(account_id: str | None = None, limit: int = Query(default=100, ge=1, le=500), owner: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> list[dict]:
    query = select(Transaction).join(Account, Transaction.account_id == Account.id).where(Account.owner_id == owner)
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    rows = (await session.scalars(query.order_by(Transaction.created_at.desc()).limit(limit))).all()
    return [_serialize(row) for row in rows]


@router.post("/transactions")
async def create_transaction(body: TransactionCreate, owner: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> dict:
    account = await session.scalar(select(Account).where(Account.id == body.account_id, Account.owner_id == owner, Account.is_active.is_(True)))
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    if body.currency != account.currency:
        raise HTTPException(status_code=422, detail="Transaction currency must match account currency")
    now = datetime.now(timezone.utc)
    row = Transaction(id=str(uuid.uuid4()), account_id=account.id, description=body.description.strip(), amount=body.amount, entry_type=body.entry_type, currency=body.currency, category=body.category.strip(), due_date=body.due_date, paid_at=now if body.is_confirmed else None, is_confirmed=body.is_confirmed, recurrence_rule=None, created_at=now)
    session.add(row)
    await session.commit()
    return _serialize(row)


@router.get("/finance/summary")
async def finance_summary(owner: str = Depends(_user_id), session: AsyncSession = Depends(get_session)) -> dict:
    rows = (await session.execute(select(Transaction.currency, Transaction.entry_type, func.sum(Transaction.amount)).join(Account, Transaction.account_id == Account.id).where(Account.owner_id == owner, Transaction.is_confirmed.is_(True)).group_by(Transaction.currency, Transaction.entry_type))).all()
    totals: dict[str, dict[str, Decimal]] = {}
    for currency, entry_type, amount in rows:
        totals.setdefault(currency, {"income": Decimal("0"), "expense": Decimal("0")})[entry_type] = amount or Decimal("0")
    return {"by_currency": [{"currency": currency, "income": str(values["income"]), "expense": str(values["expense"]), "balance": str(values["income"] - values["expense"])} for currency, values in sorted(totals.items())]}
