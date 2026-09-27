import jwt
import pytest

from app.security import create_access_token, decode_access_token


def test_empty_subject_is_rejected(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters-long")
    with pytest.raises(ValueError, match="subject"):
        create_access_token("   ")


def test_nonpositive_token_lifetime_is_rejected(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters-long")
    with pytest.raises(ValueError, match="at least one minute"):
        create_access_token("user-1", expires_minutes=0)


def test_malformed_token_is_rejected(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters-long")
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token("not.a.valid.jwt")
