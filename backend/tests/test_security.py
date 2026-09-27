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
