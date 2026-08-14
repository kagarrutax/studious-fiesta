"""S10 — rate limit + ownership smoke."""

from io import BytesIO

import pytest

from app.core.config import settings
from app.core.rate_limit import rate_limiter


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    rate_limiter._buckets.clear()
    yield
    rate_limiter._buckets.clear()


def _auth(client, username: str, email: str) -> dict[str, str]:
    assert (
        client.post(
            "/api/auth/register",
            json={"username": username, "email": email, "password": "secret123"},
        ).status_code
        == 201
    )
    token = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login_rate_limit_returns_429(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "rate_limit_login_per_minute", 3)

    payload = {"email": "nobody@studious.party", "password": "wrong"}
    codes = [
        client.post("/api/auth/login", json=payload).status_code for _ in range(4)
    ]
    assert codes[:3] == [401, 401, 401]
    assert codes[3] == 429


def test_message_rate_limit_returns_429(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "rate_limit_message_per_minute", 2)
    monkeypatch.setattr(settings, "rate_limit_login_per_minute", 100)
    monkeypatch.setattr(settings, "rate_limit_register_per_minute", 100)

    headers_a = _auth(client, "rl_a", "rl-a@test.com")
    headers_b = _auth(client, "rl_b", "rl-b@test.com")
    peer_id = client.get("/api/auth/me", headers=headers_b).json()["id"]
    conv_id = client.post(
        "/api/conversations",
        headers=headers_a,
        json={"user_id": peer_id},
    ).json()["id"]

    ok1 = client.post(
        f"/api/conversations/{conv_id}/messages",
        headers=headers_a,
        json={"body": "uno"},
    )
    ok2 = client.post(
        f"/api/conversations/{conv_id}/messages",
        headers=headers_a,
        json={"body": "dos"},
    )
    blocked = client.post(
        f"/api/conversations/{conv_id}/messages",
        headers=headers_a,
        json={"body": "tres"},
    )
    assert ok1.status_code == 201
    assert ok2.status_code == 201
    assert blocked.status_code == 429


def test_other_user_cannot_delete_post(client) -> None:
    headers_a = _auth(client, "own_p", "own-p@test.com")
    headers_b = _auth(client, "oth_p", "oth-p@test.com")
    post_id = client.post(
        "/api/posts",
        headers=headers_a,
        json={"content": "privado"},
    ).json()["id"]
    assert client.delete(f"/api/posts/{post_id}", headers=headers_b).status_code == 403


def test_other_user_cannot_delete_resource(client) -> None:
    headers_a = _auth(client, "own_res", "own-res@test.com")
    headers_b = _auth(client, "oth_res", "oth-res@test.com")
    files = {"file": ("a.pdf", BytesIO(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"), "application/pdf")}
    rid = client.post(
        "/api/resources",
        headers=headers_a,
        data={"title": "Solo mio", "category": "notes"},
        files=files,
    ).json()["id"]
    assert client.delete(f"/api/resources/{rid}", headers=headers_b).status_code == 403


def test_other_user_cannot_delete_event(client) -> None:
    from datetime import datetime, timedelta, timezone

    headers_a = _auth(client, "own_ev", "own-ev@test.com")
    headers_b = _auth(client, "oth_ev", "oth-ev@test.com")
    starts = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    eid = client.post(
        "/api/events",
        headers=headers_a,
        json={"title": "Meetup", "starts_at": starts},
    ).json()["id"]
    assert client.delete(f"/api/events/{eid}", headers=headers_b).status_code == 403
