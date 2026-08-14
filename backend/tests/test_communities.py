"""Tests for communities MVP (Fase 4)."""


def _auth(client, username, email):
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "test1234"},
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "test1234"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_create_join_and_post(client):
    headers_a = _auth(client, "alice", "alice-c@test.com")
    headers_b = _auth(client, "bob", "bob-c@test.com")

    res = client.post(
        "/api/communities",
        headers=headers_a,
        json={"name": "Cálculo I", "description": "Grupo de estudio", "rules": "Sé respetuoso"},
    )
    assert res.status_code == 201
    community = res.json()
    assert community["is_member"] is True
    assert community["my_role"] == "admin"
    assert community["members_count"] == 1
    cid = community["id"]

    # Non-member cannot post
    denied = client.post(
        f"/api/communities/{cid}/posts",
        headers=headers_b,
        json={"content": "Hola desde fuera"},
    )
    assert denied.status_code == 403

    joined = client.post(f"/api/communities/{cid}/join", headers=headers_b)
    assert joined.status_code == 200
    assert joined.json()["is_member"] is True
    assert joined.json()["members_count"] == 2

    posted = client.post(
        f"/api/communities/{cid}/posts",
        headers=headers_b,
        json={"content": "Apuntes de la semana #calculo"},
    )
    assert posted.status_code == 201
    assert posted.json()["community_id"] == cid
    assert "calculo" in posted.json()["hashtags"]

    feed = client.get(f"/api/communities/{cid}/posts", headers=headers_a)
    assert feed.status_code == 200
    assert len(feed.json()["items"]) == 1

    # Global feed excludes community posts
    global_feed = client.get("/api/posts", headers=headers_a).json()["items"]
    assert all(p.get("community_id") in (None, 0) or p.get("community_id") is None for p in global_feed)
    assert all(p["id"] != posted.json()["id"] for p in global_feed)


def test_owner_cannot_leave(client):
    headers = _auth(client, "owner", "owner-c@test.com")
    cid = client.post(
        "/api/communities",
        headers=headers,
        json={"name": "Club Robótica"},
    ).json()["id"]
    res = client.delete(f"/api/communities/{cid}/join", headers=headers)
    assert res.status_code == 400


def test_admin_can_update_rules(client):
    headers_a = _auth(client, "adminu", "admin-c@test.com")
    headers_b = _auth(client, "memberu", "member-c@test.com")
    cid = client.post(
        "/api/communities",
        headers=headers_a,
        json={"name": "Literatura"},
    ).json()["id"]
    client.post(f"/api/communities/{cid}/join", headers=headers_b)

    forbidden = client.patch(
        f"/api/communities/{cid}",
        headers=headers_b,
        json={"rules": "No spam"},
    )
    assert forbidden.status_code == 403

    ok = client.patch(
        f"/api/communities/{cid}",
        headers=headers_a,
        json={"rules": "No spam"},
    )
    assert ok.status_code == 200
    assert ok.json()["rules"] == "No spam"


def test_list_members(client):
    headers_a = _auth(client, "alice_m", "a1-c@test.com")
    headers_b = _auth(client, "bob_m", "b1-c@test.com")
    cid = client.post("/api/communities", headers=headers_a, json={"name": "Física"}).json()["id"]
    client.post(f"/api/communities/{cid}/join", headers=headers_b)
    members = client.get(f"/api/communities/{cid}/members", headers=headers_a).json()
    assert len(members) == 2
    usernames = {m["username"] for m in members}
    assert usernames == {"alice_m", "bob_m"}
