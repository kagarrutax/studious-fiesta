"""Tests for notifications mailbox + WebSocket (Fase 8)."""


def _auth(client, username, email):
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "test1234"},
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "test1234"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, token


def test_like_creates_notification_for_author(client):
    headers_a, _ = _auth(client, "alice", "alice@test.com")
    headers_b, _ = _auth(client, "bob", "bob@test.com")

    post = client.post("/api/posts", headers=headers_a, json={"content": "Hola campus"}).json()
    res = client.post(f"/api/posts/{post['id']}/like", headers=headers_b)
    assert res.status_code == 200

    inbox = client.get("/api/notifications", headers=headers_a)
    assert inbox.status_code == 200
    items = inbox.json()["items"]
    assert len(items) == 1
    assert items[0]["type"] == "like"
    assert items[0]["entity_id"] == post["id"]
    assert items[0]["actor"]["username"] == "bob"

    count = client.get("/api/notifications/unread-count", headers=headers_a).json()
    assert count["unread"] == 1

    before = count["unread"]
    client.post(f"/api/posts/{post['id']}/like", headers=headers_a)
    after = client.get("/api/notifications/unread-count", headers=headers_a).json()["unread"]
    assert after == before


def test_follow_and_comment_notify(client):
    headers_a, _ = _auth(client, "alice", "alice2@test.com")
    headers_b, _ = _auth(client, "bob", "bob2@test.com")
    alice_id = client.get("/api/auth/me", headers=headers_a).json()["id"]

    client.post(f"/api/users/{alice_id}/follow", headers=headers_b)
    post = client.post("/api/posts", headers=headers_a, json={"content": "Post"}).json()
    client.post(
        f"/api/posts/{post['id']}/comments",
        headers=headers_b,
        json={"content": "Nice"},
    )

    items = client.get("/api/notifications", headers=headers_a).json()["items"]
    types = {i["type"] for i in items}
    assert "follow" in types
    assert "comment" in types


def test_mark_read_clears_badge(client):
    headers_a, _ = _auth(client, "alice", "alice3@test.com")
    headers_b, _ = _auth(client, "bob", "bob3@test.com")
    alice_id = client.get("/api/auth/me", headers=headers_a).json()["id"]
    client.post(f"/api/users/{alice_id}/follow", headers=headers_b)

    assert client.get("/api/notifications/unread-count", headers=headers_a).json()["unread"] == 1
    res = client.patch("/api/notifications/read", headers=headers_a)
    assert res.status_code == 200
    assert res.json()["unread"] == 0


def test_notifications_require_auth(client):
    assert client.get("/api/notifications").status_code == 401
    assert client.get("/api/notifications/unread-count").status_code == 401


def test_ws_receives_notification_new(client):
    headers_a, token_a = _auth(client, "alice", "alice4@test.com")
    headers_b, _ = _auth(client, "bob", "bob4@test.com")
    alice_id = client.get("/api/auth/me", headers=headers_a).json()["id"]

    with client.websocket_connect(f"/ws/notifications?token={token_a}") as ws:
        # On connect: presence.snapshot then badge (order may vary with send_to_user).
        seen = []
        for _ in range(4):
            msg = ws.receive_json()
            seen.append(msg)
            if msg.get("type") == "badge":
                break
        assert any(m.get("type") == "badge" for m in seen)
        badge = next(m for m in seen if m["type"] == "badge")
        assert badge["unread"] == 0

        client.post(f"/api/users/{alice_id}/follow", headers=headers_b)

        # Expect notification.new then badge (or either order via send_many)
        messages = [ws.receive_json(), ws.receive_json()]
        types = {m["type"] for m in messages}
        assert "notification.new" in types
        assert "badge" in types
        new_msg = next(m for m in messages if m["type"] == "notification.new")
        assert new_msg["notification"]["type"] == "follow"
