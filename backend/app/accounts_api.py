"""Owner-scoped finance account endpoints."""
import uuid
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import Account
from .security import decode_access_token

router = APIRouter(prefix="/api/v1/accounts", tags=["accounts"])
bearer = HTTPBearer(auto_error=False)


class AccountCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    account_type: str = Field(min_length=1, max_length=30)
    currency: str = Field(default="BRL", pattern="^[A-Z]{3}$")

    @field_validator("name", "account_type")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be blank")
        return value


async def user_id(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer token required")
    try:
        subject = decode_access_token(credentials.credentials).get("sub")
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from None
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    return subject


@router.get("")
async def list_accounts(owner: str = Depends(user_id), session: AsyncSession = Depends(get_session)) -> list[dict]:
    rows = (await session.scalars(select(Account).where(Account.owner_id == owner, Account.is_active.is_(True)).order_by(Account.created_at.desc()))).all()
    return [{"id": row.id, "name": row.name, "account_type": row.account_type, "currency": row.currency, "opening_balance": row.opening_balance} for row in rows]


@router.post("")
async def create_account(body: AccountCreate, owner: str = Depends(user_id), session: AsyncSession = Depends(get_session)) -> dict:
    row = Account(id=str(uuid.uuid4()), owner_id=owner, name=body.name, account_type=body.account_type, currency=body.currency, opening_balance=0, is_active=True, created_at=datetime.now(timezone.utc))
    session.add(row)
    await session.commit()
    return {"id": row.id, "name": row.name, "account_type": row.account_type, "currency": row.currency, "opening_balance": row.opening_balance}
