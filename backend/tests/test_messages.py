"""Tests for 1:1 realtime messaging (Fase 7)."""


def _auth(client, username, email):
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "test1234"},
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "test1234"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, token


def test_open_send_and_inbox(client):
    headers_a, _ = _auth(client, "alice_m", "alice-m@test.com")
    headers_b, _ = _auth(client, "bob_m", "bob-m@test.com")
    bob_id = client.get("/api/auth/me", headers=headers_b).json()["id"]

    opened = client.post("/api/conversations", headers=headers_a, json={"user_id": bob_id})
    assert opened.status_code == 201, opened.text
    cid = opened.json()["id"]
    assert opened.json()["peer"]["username"] == "bob_m"

    again = client.post("/api/conversations", headers=headers_a, json={"user_id": bob_id})
    assert again.status_code == 201
    assert again.json()["id"] == cid

    sent = client.post(
        f"/api/conversations/{cid}/messages",
        headers=headers_a,
        json={"body": "Hola Bob"},
    )
    assert sent.status_code == 201
    assert sent.json()["body"] == "Hola Bob"

    inbox_b = client.get("/api/conversations", headers=headers_b).json()["items"]
    assert len(inbox_b) == 1
    assert inbox_b[0]["unread_count"] == 1
    assert inbox_b[0]["last_message"]["body"] == "Hola Bob"

    hist = client.get(f"/api/conversations/{cid}/messages", headers=headers_b).json()
    assert len(hist["items"]) == 1

    read = client.post(f"/api/conversations/{cid}/read", headers=headers_b)
    assert read.status_code == 200
    assert client.get("/api/conversations", headers=headers_b).json()["items"][0]["unread_count"] == 0

    notices = client.get("/api/notifications", headers=headers_b).json()["items"]
    assert any(n["type"] == "message" for n in notices)


def test_cannot_message_self_or_strangers_thread(client):
    headers_a, _ = _auth(client, "solo_m", "solo-m@test.com")
    me = client.get("/api/auth/me", headers=headers_a).json()
    bad = client.post("/api/conversations", headers=headers_a, json={"user_id": me["id"]})
    assert bad.status_code == 400

    headers_b, _ = _auth(client, "other_m", "other-m@test.com")
    cid = client.post(
        "/api/conversations",
        headers=headers_a,
        json={"user_id": client.get("/api/auth/me", headers=headers_b).json()["id"]},
    ).json()["id"]

    headers_c, _ = _auth(client, "eve_m", "eve-m@test.com")
    forbidden = client.get(f"/api/conversations/{cid}/messages", headers=headers_c)
    assert forbidden.status_code == 403


def test_ws_receives_message_new(client):
    headers_a, token_a = _auth(client, "alice_ws", "alice-ws@test.com")
    headers_b, token_b = _auth(client, "bob_ws", "bob-ws@test.com")
    bob_id = client.get("/api/auth/me", headers=headers_b).json()["id"]
    cid = client.post("/api/conversations", headers=headers_a, json={"user_id": bob_id}).json()["id"]

    with client.websocket_connect(f"/ws/chat?token={token_b}") as ws:
        client.post(
            f"/api/conversations/{cid}/messages",
            headers=headers_a,
            json={"body": "ping live"},
        )
        found = False
        for _ in range(6):
            msg = ws.receive_json()
            if msg.get("type") == "message.new":
                assert msg["message"]["body"] == "ping live"
                found = True
                break
        assert found
