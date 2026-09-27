"""User-scoped account and transaction API."""
from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import User, Account, Transaction
from .security import decode_access_token

router = APIRouter(prefix="/api/v1", tags=["finance"])
bearer = HTTPBearer(auto_error=False)


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_session),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer token required")
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    user = await db.scalar(select(User).where(User.id == str(payload["sub"])))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User is unavailable")
    return user.id


class AccountCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    account_type: str = Field(min_length=1, max_length=30)
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")
    opening_balance: Decimal = Field(default=Decimal("0"), max_digits=14, decimal_places=2)


class TransactionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    account_id: str = Field(min_length=1, max_length=36)
    description: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    entry_type: str = Field(pattern="^(income|expense)$")
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")
    category: str = Field(min_length=1, max_length=100)
    due_date: date | None = None


def account_json(a: Account) -> dict:
    return {"id": a.id, "name": a.name, "account_type": a.account_type,
            "currency": a.currency, "opening_balance": str(a.opening_balance),
            "is_active": a.is_active, "created_at": a.created_at}


def transaction_json(t: Transaction) -> dict:
    return {"id": t.id, "account_id": t.account_id, "description": t.description,
            "amount": str(t.amount), "entry_type": t.entry_type, "currency": t.currency,
            "category": t.category, "due_date": t.due_date, "paid_at": t.paid_at,
            "is_confirmed": t.is_confirmed, "created_at": t.created_at}


@router.get("/accounts")
async def list_accounts(user_id: str = Depends(current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(Account).where(Account.user_id == user_id).order_by(Account.created_at.desc()))
    return [account_json(a) for a in result.scalars().all()]


@router.post("/accounts", status_code=201)
async def create_account(body: AccountCreate, user_id: str = Depends(current_user),
                         db: AsyncSession = Depends(get_session)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Account name must not be blank")
    account_type = body.account_type.strip()
    if not account_type:
        raise HTTPException(status_code=422, detail="Account type must not be blank")
    account = Account(id=str(uuid4()), user_id=user_id, name=name,
                      account_type=account_type, currency=body.currency,
                      opening_balance=body.opening_balance, is_active=True,
                      created_at=datetime.now(timezone.utc))
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account_json(account)


@router.get("/transactions")
async def list_transactions(account_id: str | None = None, user_id: str = Depends(current_user),
                            db: AsyncSession = Depends(get_session)):
    query = select(Transaction).where(Transaction.user_id == user_id)
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    result = await db.execute(query.order_by(Transaction.created_at.desc()))
    return [transaction_json(t) for t in result.scalars().all()]


@router.post("/transactions", status_code=201)
async def create_transaction(body: TransactionCreate, user_id: str = Depends(current_user),
                             db: AsyncSession = Depends(get_session)):
    account = await db.scalar(select(Account).where(
        Account.id == body.account_id, Account.user_id == user_id, Account.is_active.is_(True)))
    if account is None:
        raise HTTPException(status_code=404, detail="Active account not found")
    if account.currency != body.currency:
        raise HTTPException(status_code=422, detail="Transaction currency must match account currency")
    description, category = body.description.strip(), body.category.strip()
    if not description or not category:
        raise HTTPException(status_code=422, detail="Description and category are required")
    transaction = Transaction(
        id=str(uuid4()), user_id=user_id, account_id=account.id,
        description=description, amount=body.amount, entry_type=body.entry_type,
        currency=body.currency, category=category, due_date=body.due_date,
        paid_at=None, is_confirmed=False, created_at=datetime.now(timezone.utc))
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction_json(transaction)


@router.post("/transactions/{transaction_id}/confirm")
async def confirm_transaction(transaction_id: str, user_id: str = Depends(current_user),
                              db: AsyncSession = Depends(get_session)):
    transaction = await db.scalar(select(Transaction).where(
        Transaction.id == transaction_id, Transaction.user_id == user_id))
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if not transaction.is_confirmed:
        transaction.is_confirmed = True
        transaction.paid_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(transaction)
    return transaction_json(transaction)


@router.get("/summary")
async def financial_summary(user_id: str = Depends(current_user), db: AsyncSession = Depends(get_session)):
    accounts_result = await db.execute(select(Account).where(
        Account.user_id == user_id, Account.is_active.is_(True)))
    accounts = accounts_result.scalars().all()
    transactions_result = await db.execute(select(Transaction).where(
        Transaction.user_id == user_id, Transaction.is_confirmed.is_(True)))
    transactions = transactions_result.scalars().all()
    currencies = {a.currency for a in accounts} | {t.currency for t in transactions}
    summary = {}
    for currency in sorted(currencies):
        opening = sum((a.opening_balance for a in accounts if a.currency == currency), Decimal("0"))
        movement = sum((t.amount if t.entry_type == "income" else -t.amount
                        for t in transactions if t.currency == currency), Decimal("0"))
        summary[currency] = {"opening_balance": str(opening), "confirmed_cash_flow": str(movement),
                             "current_balance": str(opening + movement)}
    return {"accounts_count": len(accounts), "confirmed_transactions": len(transactions),
            "by_currency": summary}
