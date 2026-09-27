from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hash_is_not_plaintext_and_verifies():
    hashed = hash_password("correct horse battery staple")
    assert hashed != "correct horse battery staple"
    assert verify_password("correct horse battery staple", hashed)
    assert not verify_password("wrong password", hashed)


def test_short_password_is_rejected():
    with pytest.raises(ValueError, match="12 characters"):
        hash_password("short")


def test_token_requires_configured_secret(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        create_access_token("user-1")


def test_access_token_round_trip(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters-long")
    token = create_access_token("user-1")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-1"
    assert payload["type"] == "access"


def test_access_token_rejects_a_different_secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "first-test-secret-that-is-at-least-32-characters")
    token = create_access_token("user-1")
    monkeypatch.setenv("JWT_SECRET", "second-test-secret-that-is-at-least-32-characters")
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_access_token_rejects_malformed_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters-long")
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token("not.a.valid.jwt")


@pytest.mark.parametrize("payload", [
    {"sub": "user-1"},
    {"type": "access"},
    {"sub": "", "type": "access"},
    {"sub": "   ", "type": "access"},
    {"sub": "user-1", "type": "refresh"},
])
def test_token_with_invalid_access_claims_is_rejected(monkeypatch, payload):
    secret = "test-secret-that-is-at-least-32-characters-long"
    monkeypatch.setenv("JWT_SECRET", secret)
    token = jwt.encode(payload, secret, algorithm="HS256")
    with pytest.raises(ValueError, match="Invalid access token"):
        decode_access_token(token)


def test_expired_access_token_is_rejected(monkeypatch):
    secret = "test-secret-that-is-at-least-32-characters-long"
    monkeypatch.setenv("JWT_SECRET", secret)
    token = jwt.encode(
        {
            "sub": "user-1",
            "type": "access",
            "iat": datetime.now(timezone.utc) - timedelta(minutes=2),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        secret,
        algorithm="HS256",
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_decode_rejects_missing_secret(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        decode_access_token("not.a.valid.jwt")
