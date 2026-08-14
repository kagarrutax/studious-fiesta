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
    assert "communities" in data
    assert "events" in data
    assert "resources" in data


def test_search_no_auth(client) -> None:
    res = client.get("/api/search?q=test")
    assert res.status_code == 401
    assert res.json()["detail"] == "No autenticado"


def test_search_types_communities_events_resources(client) -> None:
    headers = auth_header(client)
    from datetime import datetime, timedelta, timezone
    from io import BytesIO

    client.post(
        "/api/communities",
        headers=headers,
        json={"name": "Club Cálculo", "description": "Grupo de estudio"},
    )
    client.post(
        "/api/events",
        headers=headers,
        json={
            "title": "Feria de cálculo",
            "starts_at": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "location": "Aula 1",
        },
    )
    files = {"file": ("a.pdf", BytesIO(b"%PDF-1.4\n%%EOF\n"), "application/pdf")}
    client.post(
        "/api/resources",
        headers=headers,
        data={"title": "Guía de cálculo", "category": "notes"},
        files=files,
    )

    comm = client.get("/api/search?q=cálculo&type=communities", headers=headers)
    assert comm.status_code == 200
    assert len(comm.json()["communities"]) >= 1
    assert comm.json()["users"] == []
    assert comm.json()["posts"] == []

    ev = client.get("/api/search?q=feria&type=events", headers=headers)
    assert ev.status_code == 200
    assert len(ev.json()["events"]) >= 1

    res = client.get("/api/search?q=guía&type=resources", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["resources"]) >= 1

    bad = client.get("/api/search?q=x&type=nopes", headers=headers)
    assert bad.status_code == 422

