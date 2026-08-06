def test_register_login_and_me(client) -> None:
    register = client.post(
        "/api/auth/register",
        json={
            "username": "alice",
            "email": "alice@studious.party",
            "password": "secret123",
        },
    )
    assert register.status_code == 201
    assert register.json()["username"] == "alice"

    login = client.post(
        "/api/auth/login",
        json={"email": "alice@studious.party", "password": "secret123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert token

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "alice@studious.party"


def test_login_invalid_credentials(client) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@studious.party", "password": "wrong"},
    )
    assert response.status_code == 401


def test_duplicate_register(client) -> None:
    payload = {
        "username": "bob",
        "email": "bob@studious.party",
        "password": "secret123",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 400
