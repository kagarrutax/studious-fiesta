def auth_header(client) -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={
            "username": "erin",
            "email": "erin@studious.party",
            "password": "secret123",
        },
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "erin@studious.party", "password": "secret123"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_stats_include_recent_activity(client) -> None:
    headers = auth_header(client)
    client.post(
        "/api/posts",
        headers=headers,
        json={"content": "Post reciente", "image_url": None},
    )

    res = client.get("/api/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["users"] >= 1
    assert data["posts"] >= 1
    assert isinstance(data["recent_posts"], list)
    assert len(data["recent_posts"]) >= 1
    assert data["recent_posts"][0]["content"] == "Post reciente"
    assert isinstance(data["recent_users"], list)
    assert any(u["username"] == "erin" for u in data["recent_users"])
    assert "me" in data
    assert data["me"]["posts"] >= 1
    assert data["me"]["followers"] == 0
    assert "password_hash" not in data
    assert isinstance(data.get("recent_notifications"), list)
    assert isinstance(data.get("my_communities"), list)
    assert isinstance(data.get("upcoming_events"), list)
