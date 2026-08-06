def auth_headers(client, username="perfiluser", email="perfil@studious.party"):
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "secret123"},
    )
    login = client.post("/api/auth/login", json={"email": email, "password": "secret123"})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_update_profile_bio(client):
    headers = auth_headers(client)
    updated = client.patch(
        "/api/auth/me",
        headers=headers,
        json={"bio": "Estudiante de sistemas en Studious Party"},
    )
    assert updated.status_code == 200
    assert updated.json()["bio"] == "Estudiante de sistemas en Studious Party"

    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["bio"].startswith("Estudiante")
