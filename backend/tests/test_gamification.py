"""Share/report + gamification (Sprint S9)."""

from io import BytesIO


def _auth(client, username, email):
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "test1234"},
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "test1234"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_post_awards_xp_and_first_post_badge(client):
    headers = _auth(client, "gamer1", "gamer1@test.com")
    before = client.get("/api/gamification/me", headers=headers).json()
    assert before["xp"] == 0
    assert before["level"] == 1

    client.post("/api/posts", headers=headers, json={"content": "Mi primer post #campus"})
    me = client.get("/api/gamification/me", headers=headers).json()
    assert me["xp"] == 10
    assert me["level"] == 1
    codes = {b["code"] for b in me["badges"]}
    assert "first_post" in codes

    profile = client.get("/api/auth/me", headers=headers).json()
    # me auth may not include xp; check public profile
    uid = profile["id"]
    pub = client.get(f"/api/users/{uid}", headers=headers).json()
    assert pub["xp"] == 10
    assert any(b["code"] == "first_post" for b in pub["badges"])


def test_share_and_report(client):
    headers_a = _auth(client, "share_a", "share-a@test.com")
    headers_b = _auth(client, "share_b", "share-b@test.com")
    post = client.post("/api/posts", headers=headers_a, json={"content": "Comparte esto"}).json()

    share = client.post(f"/api/posts/{post['id']}/share", headers=headers_b)
    assert share.status_code == 200
    assert share.json()["shares_count"] == 1
    # idempotent
    again = client.post(f"/api/posts/{post['id']}/share", headers=headers_b)
    assert again.json()["shares_count"] == 1

    report = client.post(
        f"/api/posts/{post['id']}/report",
        headers=headers_b,
        json={"reason": "Spam molesto"},
    )
    assert report.status_code == 200
    assert report.json()["reported"] is True

    self_report = client.post(
        f"/api/posts/{post['id']}/report",
        headers=headers_a,
        json={"reason": "No debería"},
    )
    assert self_report.status_code == 400


def test_comment_and_resource_xp(client):
    headers = _auth(client, "gamer2", "gamer2@test.com")
    post = client.post("/api/posts", headers=headers, json={"content": "Base"}).json()
    client.post(
        f"/api/posts/{post['id']}/comments",
        headers=headers,
        json={"content": "Mi comentario"},
    )
    files = {"file": ("n.pdf", BytesIO(b"%PDF-1.4\n%%EOF\n"), "application/pdf")}
    client.post(
        "/api/resources",
        headers=headers,
        data={"title": "Apunte XP", "category": "notes"},
        files=files,
    )
    me = client.get("/api/gamification/me", headers=headers).json()
    # post 10 + comment 5 + resource 15
    assert me["xp"] == 30
    codes = {b["code"] for b in me["badges"]}
    assert "first_comment" in codes
    assert "first_resource" in codes

    board = client.get("/api/gamification/leaderboard", headers=headers)
    assert board.status_code == 200
    assert len(board.json()) >= 1
    assert board.json()[0]["xp"] >= 30
