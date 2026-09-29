import asyncio

import pytest

from app.auth_routes import AnonymousSessionRequest, anonymous_session
from app.security import decode_access_token


class FakeSession:
    def __init__(self):
        self.user = None

    async def scalar(self, _statement):
        return self.user

    def add(self, user):
        self.user = user

    async def commit(self):
        return None

    async def refresh(self, _user):
        return None

    async def rollback(self):
        return None


def test_anonymous_session_creates_and_reuses_device_scoped_user(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters-long")
    db = FakeSession()
    request = AnonymousSessionRequest(device_id="6d4bbec4-4ad4-4f3b-9cc9-27f9b3fbdc44")

    first = asyncio.run(anonymous_session(request, db))
    second = asyncio.run(anonymous_session(request, db))

    first_user_id = first["user"]["id"]
    second_user_id = second["user"]["id"]
    assert first_user_id == second_user_id
    assert first["user"]["role"] == "anonymous"
    assert decode_access_token(first["access_token"])["sub"] == first_user_id
    assert decode_access_token(second["access_token"])["sub"] == first_user_id


@pytest.mark.parametrize("device_id", [
    "not-a-uuid",
    "6d4bbec4-4ad4-1f3b-9cc9-27f9b3fbdc44",
    "6d4bbec4-4ad4-4f3b-7cc9-27f9b3fbdc44",
])
def test_anonymous_session_requires_random_uuid_v4(device_id):
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        AnonymousSessionRequest(device_id=device_id)
