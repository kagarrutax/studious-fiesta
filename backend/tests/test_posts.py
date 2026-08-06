def auth_header(client) -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={
            "username": "carol",
            "email": "carol@studious.party",
            "password": "secret123",
        },
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "carol@studious.party", "password": "secret123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_posts(client) -> None:
    headers = auth_header(client)

    created = client.post(
        "/api/posts",
        headers=headers,
        json={"content": "Hola Studious Party", "image_url": None},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["content"] == "Hola Studious Party"
    assert body["author"]["username"] == "carol"
    assert body["likes_count"] == 0

    feed = client.get("/api/posts", headers=headers)
    assert feed.status_code == 200
    assert len(feed.json()) >= 1

    detail = client.get(f"/api/posts/{body['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["id"] == body["id"]


def test_get_user_profile(client) -> None:
    headers = auth_header(client)
    client.post(
        "/api/posts",
        headers=headers,
        json={"content": "Post de perfil"},
    )

    me = client.get("/api/auth/me", headers=headers).json()
    profile = client.get(f"/api/users/{me['id']}", headers=headers)
    assert profile.status_code == 200
    data = profile.json()
    assert data["username"] == "carol"
    assert data["posts_count"] >= 1


def test_posts_require_auth(client) -> None:
    response = client.get("/api/posts")
    assert response.status_code == 401
