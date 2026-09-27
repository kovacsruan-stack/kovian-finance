"""Password hashing and signed access-token primitives.

Authentication routes use these helpers for Argon2 password hashes and
short-lived, signed access tokens. Rate limiting and account recovery remain
separate application-level responsibilities.
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

_password_hash = PasswordHash.recommended()
_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    if len(password) < 12:
        raise ValueError("Password must contain at least 12 characters")
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _password_hash.verify(password, password_hash)


def create_access_token(subject: str, *, expires_minutes: int = 30) -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret or len(secret) < 32:
        raise RuntimeError("JWT_SECRET must be configured with at least 32 characters")
    if expires_minutes < 1:
        raise ValueError("Token lifetime must be at least one minute")
    if not subject.strip():
        raise ValueError("Token subject is required")
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
        "type": "access",
    }
    return jwt.encode(payload, secret, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict:
    secret = os.getenv("JWT_SECRET")
    if not secret or len(secret) < 32:
        raise RuntimeError("JWT_SECRET must be configured with at least 32 characters")
    payload = jwt.decode(token, secret, algorithms=[_ALGORITHM])
    subject = payload.get("sub")
    if payload.get("type") != "access" or not isinstance(subject, str) or not subject.strip():
        raise ValueError("Invalid access token")
    return payload
