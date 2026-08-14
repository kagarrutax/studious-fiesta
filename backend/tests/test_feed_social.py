def auth_header(client, username="erin", email="erin@studious.party") -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "secret123"},
    )
    login = client.post("/api/auth/login", json={"email": email, "password": "secret123"})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_hashtags_and_save_and_feed(client) -> None:
    headers_a = auth_header(client, "alicef", "alicef@studious.party")
    headers_b = auth_header(client, "bobf", "bobf@studious.party")

    created = client.post(
        "/api/posts",
        headers=headers_a,
        json={"content": "Clase de #campus y #Python hoy", "image_url": None},
    )
    assert created.status_code == 201
    post = created.json()
    assert "campus" in post["hashtags"]
    assert "python" in post["hashtags"]
    post_id = post["id"]

    saved = client.post(f"/api/posts/{post_id}/save", headers=headers_b)
    assert saved.status_code == 200
    assert saved.json()["saved"] is True

    detail = client.get(f"/api/posts/{post_id}", headers=headers_b).json()
    assert detail["saved_by_me"] is True

    unsaved = client.delete(f"/api/posts/{post_id}/save", headers=headers_b)
    assert unsaved.json()["saved"] is False

    page = client.get("/api/posts", headers=headers_a, params={"limit": 5})
    assert page.status_code == 200
    body = page.json()
    assert "items" in body
    assert "next_cursor" in body

    bob_id = client.get("/api/auth/me", headers=headers_b).json()["id"]
    client.post(f"/api/users/{bob_id}/follow", headers=headers_a)
    client.post(
        "/api/posts",
        headers=headers_b,
        json={"content": "Hola desde bob #hola", "image_url": None},
    )
    feed = client.get("/api/feed", headers=headers_a)
    assert feed.status_code == 200
    authors = {item["author"]["username"] for item in feed.json()["items"]}
    assert "bobf" in authors or "alicef" in authors
