"""Google OpenID Connect login endpoints."""
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import User
from .security import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["authentication"])


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=20, max_length=8192)


@router.post("/google")
async def google_login(
    body: GoogleLoginRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Verify a Google ID token and issue this product's own access token."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is not configured",
        )

    try:
        claims = id_token.verify_oauth2_token(body.id_token, Request(), audience=client_id)
    except (ValueError, GoogleAuthError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token",
        ) from None

    if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    if claims.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="Google email must be verified")

    google_sub = claims.get("sub")
    email = claims.get("email")
    normalized_email = email.lower() if isinstance(email, str) else ""
    admin_email = os.getenv("KOVIAN_ADMIN_EMAIL", "ruannpersonal@gmail.com").strip().lower()
    if not isinstance(google_sub, str) or not google_sub or not isinstance(email, str) or not email:
        raise HTTPException(status_code=401, detail="Google account is missing required claims")

    user = await session.scalar(select(User).where(User.google_sub == google_sub))
    if user is None:
        user = await session.scalar(select(User).where(User.email == email.lower()))
        if user is not None and user.google_sub not in (None, google_sub):
            raise HTTPException(status_code=409, detail="This email is linked to another Google account")
        if user is None:
            user = User(
                id=str(uuid.uuid4()),
                email=email.lower(),
                password_hash=None,
                google_sub=google_sub,
                role=("admin" if normalized_email == admin_email else "user"),
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
            session.add(user)
        else:
            user.google_sub = google_sub
    elif user.email != email.lower():
        user.email = email.lower()

    if normalized_email == admin_email:
        user.role = "admin"

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account is disabled")

    access_token = create_access_token(str(user.id))
    await session.commit()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role},
    }


_bearer = HTTPBearer(auto_error=False)


@router.get("/me")
async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Return the authenticated account from the product's own access token."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer token required", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = decode_access_token(credentials.credentials)
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired access token", headers={"WWW-Authenticate": "Bearer"}) from None
    user_id = claims.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Invalid access token subject", headers={"WWW-Authenticate": "Bearer"})
    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Account not found or disabled", headers={"WWW-Authenticate": "Bearer"})
    return {"id": user.id, "email": user.email, "role": user.role, "is_active": user.is_active}
