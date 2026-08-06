def auth_header(client, username: str = "dave", email: str = "dave@studious.party") -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "secret123"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_like_toggle_and_comments(client) -> None:
    headers = auth_header(client)
    post = client.post(
        "/api/posts",
        headers=headers,
        json={"content": "Post para likes"},
    ).json()
    post_id = post["id"]

    liked = client.post(f"/api/posts/{post_id}/like", headers=headers)
    assert liked.status_code == 200
    assert liked.json() == {"liked": True, "likes_count": 1}

    unliked = client.post(f"/api/posts/{post_id}/like", headers=headers)
    assert unliked.json() == {"liked": False, "likes_count": 0}

    created = client.post(
        f"/api/posts/{post_id}/comments",
        headers=headers,
        json={"content": "Primer comentario"},
    )
    assert created.status_code == 201
    assert created.json()["content"] == "Primer comentario"
    assert created.json()["author"]["username"] == "dave"

    comments = client.get(f"/api/posts/{post_id}/comments", headers=headers)
    assert comments.status_code == 200
    assert len(comments.json()) == 1

    feed_item = client.get(f"/api/posts/{post_id}", headers=headers).json()
    assert feed_item["comments_count"] == 1


def test_stats(client) -> None:
    headers = auth_header(client, username="erin", email="erin@studious.party")
    client.post("/api/posts", headers=headers, json={"content": "Stats post"})
    stats = client.get("/api/stats", headers=headers)
    assert stats.status_code == 200
    data = stats.json()
    assert data["users"] >= 1
    assert data["posts"] >= 1
