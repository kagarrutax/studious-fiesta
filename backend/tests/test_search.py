def auth_header(client) -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={
            "username": "searchuser",
            "email": "searchuser@studious.party",
            "password": "secret123",
        },
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "searchuser@studious.party", "password": "secret123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_search_endpoint(client) -> None:
    headers = auth_header(client)

    # Crear datos para búsqueda
    client.post(
        "/api/posts",
        headers=headers,
        json={"content": "Este es un post de prueba sobre matemáticas", "image_url": None},
    )

    # 1. Buscar usuario existente
    res = client.get("/api/search?q=searchuser", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["users"]) >= 1
    assert data["users"][0]["username"] == "searchuser"
    # 8. Confirmar no sensibles
    assert "password" not in data["users"][0]
    assert "password_hash" not in data["users"][0]
    assert "email" not in data["users"][0]

    # 2. Buscar usuario inexistente
    res = client.get("/api/search?q=nobodyhere123", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["users"]) == 0

    # 3. Buscar publicación existente
    res = client.get("/api/search?q=matemáticas", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["posts"]) >= 1
    assert "matemáticas" in data["posts"][0]["content"]

    # 4. Buscar publicación inexistente
    res = client.get("/api/search?q=filosofia", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["posts"]) == 0

    # 5. Búsqueda vacía o solo espacios
    res = client.get("/api/search?q=   ", headers=headers)
    assert res.status_code == 400

    # 6. Coincidencias múltiples
    client.post(
        "/api/auth/register",
        json={"username": "searcher2", "email": "s2@studious.party", "password": "secretpassword"},
    )
    res = client.get("/api/search?q=search", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["users"]) >= 2

    # 7. Estructura de respuesta
    assert "users" in data
    assert "posts" in data


def test_search_no_auth(client) -> None:
    res = client.get("/api/search?q=test")
    assert res.status_code == 401
    assert res.json()["detail"] == "No autenticado"

