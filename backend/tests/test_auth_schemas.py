"""Fast unit tests for authentication request validation."""
import pytest
from pydantic import ValidationError

from app.auth_routes import LoginRequest, RegisterRequest


def test_registration_normalizes_only_at_service_boundary_and_accepts_valid_input():
    request = RegisterRequest(email="ruan@example.com", password="a-long-password-123")
    assert request.email == "ruan@example.com"
    assert len(request.password) >= 12


@pytest.mark.parametrize("email", ["not-an-email", "missing-at.example.com", "x@y", "has space@example.com"])
def test_registration_rejects_invalid_email(email):
    with pytest.raises(ValidationError):
        RegisterRequest(email=email, password="a-long-password-123")


def test_registration_rejects_short_password():
    with pytest.raises(ValidationError):
        RegisterRequest(email="ruan@example.com", password="short")


def test_auth_requests_reject_unexpected_fields():
    with pytest.raises(ValidationError):
        RegisterRequest(email="ruan@example.com", password="a-long-password-123", is_admin=True)


def test_login_requires_nonempty_password():
    with pytest.raises(ValidationError):
        LoginRequest(email="ruan@example.com", password="")
