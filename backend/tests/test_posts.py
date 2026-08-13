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

def test_delete_own_post(client) -> None:
    headers = auth_header(client)
    post = client.post("/api/posts", headers=headers, json={"content": "Para borrar", "image_url": None}).json()
    
    # Crear un like y un comentario para probar borrado en cascada
    client.post(f"/api/posts/{post['id']}/like", headers=headers)
    client.post(f"/api/posts/{post['id']}/comments", headers=headers, json={"content": "C1"})
    
    res = client.delete(f"/api/posts/{post['id']}", headers=headers)
    assert res.status_code == 204
    
    # Comprobar que no existe
    assert client.get(f"/api/posts/{post['id']}", headers=headers).status_code == 404

def test_delete_other_post_forbidden(client) -> None:
    h1 = auth_header(client)
    post = client.post("/api/posts", headers=h1, json={"content": "De h1", "image_url": None}).json()
    
    # Registrar segundo usuario
    client.post("/api/auth/register", json={"username": "user2", "email": "h2@studious.party", "password": "secret123"})
    token = client.post("/api/auth/login", json={"email": "h2@studious.party", "password": "secret123"}).json()["access_token"]
    h2 = {"Authorization": f"Bearer {token}"}
    
    res = client.delete(f"/api/posts/{post['id']}", headers=h2)
    assert res.status_code == 403

def test_edit_own_post(client) -> None:
    headers = auth_header(client)
    post = client.post("/api/posts", headers=headers, json={"content": "Original", "image_url": None}).json()
    
    res = client.patch(f"/api/posts/{post['id']}", headers=headers, json={"content": "Editado"})
    assert res.status_code == 200
    assert res.json()["content"] == "Editado"
    assert "author" in res.json()
    assert "likes_count" in res.json()
