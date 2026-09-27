"""Registration and login endpoints using hashed passwords and short-lived JWTs."""
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import User
from .security import create_access_token, decode_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
bearer = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254, pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$")
    password: str = Field(min_length=12, max_length=256)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254, pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$")
    password: str = Field(min_length=1, max_length=256)


def public_user(user: User) -> dict:
    return {"id": user.id, "email": user.email, "role": user.role,
            "is_active": user.is_active, "created_at": user.created_at}


async def authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_session),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer token required")
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    user = await db.scalar(select(User).where(User.id == str(payload["sub"])))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User is unavailable")
    return user


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_session)):
    email = str(body.email).strip().lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        user = User(id=str(uuid4()), email=email, password_hash=hash_password(body.password),
                    created_at=datetime.now(timezone.utc))
        db.add(user)
        await db.commit()
        await db.refresh(user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    return {"user": public_user(user), "access_token": create_access_token(user.id),
            "token_type": "bearer", "expires_in": 1800}


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_session)):
    email = str(body.email).strip().lower()
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"user": public_user(user), "access_token": create_access_token(user.id),
            "token_type": "bearer", "expires_in": 1800}


@router.get("/me")
async def me(user: User = Depends(authenticated_user)):
    return public_user(user)
