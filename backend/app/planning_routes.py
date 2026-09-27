"""User-scoped budgets and savings goals."""
from datetime import date
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import User, Budget, FinancialGoal
from .security import decode_access_token

router = APIRouter(prefix="/api/v1", tags=["financial planning"])
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


class BudgetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=100)
    amount_limit: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")
    period: str = Field(default="monthly", pattern="^(weekly|monthly|yearly)$")
    starts_on: date
    ends_on: date | None = None


class GoalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=160)
    target_amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    current_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=14, decimal_places=2)
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")
    target_date: date | None = None
    priority: int = Field(default=3, ge=1, le=5)


class GoalProgress(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_amount: Decimal = Field(ge=0, max_digits=14, decimal_places=2)


def budget_json(item: Budget) -> dict:
    return {"id": item.id, "name": item.name, "category": item.category,
            "amount_limit": str(item.amount_limit), "currency": item.currency,
            "period": item.period, "starts_on": item.starts_on, "ends_on": item.ends_on,
            "is_active": item.is_active}


def goal_json(item: FinancialGoal) -> dict:
    return {"id": item.id, "name": item.name, "target_amount": str(item.target_amount),
            "current_amount": str(item.current_amount), "currency": item.currency,
            "target_date": item.target_date, "priority": item.priority,
            "progress_percent": min(100, round(float(item.current_amount / item.target_amount * 100), 2)),
            "is_active": item.is_active}


@router.get("/budgets")
async def list_budgets(user_id: str = Depends(current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(Budget).where(Budget.user_id == user_id).order_by(Budget.starts_on.desc()))
    return [budget_json(item) for item in result.scalars().all()]


@router.post("/budgets", status_code=201)
async def create_budget(body: BudgetCreate, user_id: str = Depends(current_user),
                        db: AsyncSession = Depends(get_session)):
    if body.ends_on and body.ends_on < body.starts_on:
        raise HTTPException(status_code=422, detail="Budget end date cannot precede start date")
    name, category = body.name.strip(), body.category.strip()
    if not name or not category:
        raise HTTPException(status_code=422, detail="Name and category are required")
    item = Budget(id=str(uuid4()), user_id=user_id, name=name, category=category,
                  amount_limit=body.amount_limit, currency=body.currency, period=body.period,
                  starts_on=body.starts_on, ends_on=body.ends_on, is_active=True)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return budget_json(item)


@router.get("/goals")
async def list_goals(user_id: str = Depends(current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(FinancialGoal).where(
        FinancialGoal.user_id == user_id, FinancialGoal.is_active.is_(True)).order_by(FinancialGoal.priority.asc()))
    return [goal_json(item) for item in result.scalars().all()]


@router.post("/goals", status_code=201)
async def create_goal(body: GoalCreate, user_id: str = Depends(current_user),
                      db: AsyncSession = Depends(get_session)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Goal name is required")
    if body.current_amount > body.target_amount:
        raise HTTPException(status_code=422, detail="Current amount cannot exceed target amount")
    item = FinancialGoal(id=str(uuid4()), user_id=user_id, name=name,
                         target_amount=body.target_amount, current_amount=body.current_amount,
                         currency=body.currency, target_date=body.target_date,
                         priority=body.priority, is_active=True)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return goal_json(item)


@router.patch("/goals/{goal_id}/progress")
async def update_goal_progress(goal_id: str, body: GoalProgress,
                               user_id: str = Depends(current_user),
                               db: AsyncSession = Depends(get_session)):
    item = await db.scalar(select(FinancialGoal).where(
        FinancialGoal.id == goal_id, FinancialGoal.user_id == user_id,
        FinancialGoal.is_active.is_(True)))
    if item is None:
        raise HTTPException(status_code=404, detail="Active goal not found")
    if body.current_amount > item.target_amount:
        raise HTTPException(status_code=422, detail="Current amount cannot exceed target amount")
    item.current_amount = body.current_amount
    await db.commit()
    await db.refresh(item)
    return goal_json(item)
