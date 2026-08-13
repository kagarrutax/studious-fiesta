def auth_headers(client, username="edituser", email="edit@sp.party"):
    client.post("/api/auth/register",
                json={"username": username, "email": email, "password": "secret123"})
    token = client.post("/api/auth/login",
                        json={"email": email, "password": "secret123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_update_username(client):
    headers = auth_headers(client)
    res = client.patch("/api/auth/me", headers=headers, json={"username": "nuevonom"})
    assert res.status_code == 200
    assert res.json()["username"] == "nuevonom"


def test_update_username_duplicate(client):
    h1 = auth_headers(client, "userA", "a@sp.party")
    auth_headers(client, "userB", "b@sp.party")  # crea userB
    # Intentar renombrar userA a userB
    res = client.patch("/api/auth/me", headers=h1, json={"username": "userB"})
    assert res.status_code == 400
