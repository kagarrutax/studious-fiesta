"""Tests for follow/unfollow functionality."""


def _register_and_login(client, username="testuser", email="test@example.com", password="test1234"):
    client.post("/api/auth/register", json={"username": username, "email": email, "password": password})
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_follow_and_unfollow(client):
    headers_a = _register_and_login(client, "alice", "alice@test.com")
    headers_b = _register_and_login(client, "bob", "bob@test.com")

    # Get bob's id
    me_b = client.get("/api/auth/me", headers=headers_b).json()
    bob_id = me_b["id"]

    # Alice follows Bob
    res = client.post(f"/api/users/{bob_id}/follow", headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert data["following"] is True
    assert data["followers_count"] == 1

    # Alice unfollows Bob
    res = client.delete(f"/api/users/{bob_id}/follow", headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert data["following"] is False
    assert data["followers_count"] == 0


def test_cannot_follow_self(client):
    headers = _register_and_login(client)
    me = client.get("/api/auth/me", headers=headers).json()

    res = client.post(f"/api/users/{me['id']}/follow", headers=headers)
    assert res.status_code == 400


def test_follow_idempotent(client):
    headers_a = _register_and_login(client, "alice", "alice@test.com")
    headers_b = _register_and_login(client, "bob", "bob@test.com")
    bob_id = client.get("/api/auth/me", headers=headers_b).json()["id"]

    client.post(f"/api/users/{bob_id}/follow", headers=headers_a)
    res = client.post(f"/api/users/{bob_id}/follow", headers=headers_a)
    assert res.status_code == 200
    assert res.json()["followers_count"] == 1


def test_list_followers(client):
    headers_a = _register_and_login(client, "alice", "alice@test.com")
    headers_b = _register_and_login(client, "bob", "bob@test.com")
    bob_id = client.get("/api/auth/me", headers=headers_b).json()["id"]

    client.post(f"/api/users/{bob_id}/follow", headers=headers_a)
    res = client.get(f"/api/users/{bob_id}/followers", headers=headers_a)
    assert res.status_code == 200
    followers = res.json()
    assert len(followers) == 1
    assert followers[0]["username"] == "alice"


def test_profile_includes_follow_data(client):
    headers_a = _register_and_login(client, "alice", "alice@test.com")
    headers_b = _register_and_login(client, "bob", "bob@test.com")
    bob_id = client.get("/api/auth/me", headers=headers_b).json()["id"]

    # Before following
    profile = client.get(f"/api/users/{bob_id}", headers=headers_a).json()
    assert profile["followers_count"] == 0
    assert profile["following_count"] == 0
    assert profile["is_following"] is False

    # After following
    client.post(f"/api/users/{bob_id}/follow", headers=headers_a)
    profile = client.get(f"/api/users/{bob_id}", headers=headers_a).json()
    assert profile["followers_count"] == 1
    assert profile["is_following"] is True


def test_follow_nonexistent_user(client):
    headers = _register_and_login(client)
    res = client.post("/api/users/9999/follow", headers=headers)
    assert res.status_code == 404
