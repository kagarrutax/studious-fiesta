"""Tests for academic resources (Fase 5)."""

from io import BytesIO


def _auth(client, username, email):
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "test1234"},
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "test1234"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _pdf_bytes():
    # Minimal PDF header is enough for content-type checks (we don't parse PDF).
    return b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def test_subjects_seed_and_upload_download_rate(client):
    headers_a = _auth(client, "alice_r", "alice-r@test.com")
    headers_b = _auth(client, "bob_r", "bob-r@test.com")

    subjects = client.get("/api/subjects", headers=headers_a)
    assert subjects.status_code == 200
    assert len(subjects.json()) >= 1
    subject_id = subjects.json()[0]["id"]

    files = {"file": ("apuntes.pdf", BytesIO(_pdf_bytes()), "application/pdf")}
    data = {
        "title": "Apuntes semana 1",
        "description": "Derivadas",
        "category": "notes",
        "subject_id": str(subject_id),
    }
    uploaded = client.post("/api/resources", headers=headers_a, data=data, files=files)
    assert uploaded.status_code == 201, uploaded.text
    resource = uploaded.json()
    assert resource["title"] == "Apuntes semana 1"
    assert resource["subject_id"] == subject_id
    rid = resource["id"]

    listed = client.get("/api/resources", headers=headers_b, params={"subject_id": subject_id})
    assert listed.status_code == 200
    assert any(item["id"] == rid for item in listed.json()["items"])

    download = client.get(f"/api/resources/{rid}/download", headers=headers_b)
    assert download.status_code == 200
    assert download.content.startswith(b"%PDF")

    detail = client.get(f"/api/resources/{rid}", headers=headers_b).json()
    assert detail["downloads_count"] == 1

    rated = client.post(f"/api/resources/{rid}/rate", headers=headers_b, json={"score": 5})
    assert rated.status_code == 200
    assert rated.json()["my_rating"] == 5
    assert rated.json()["avg_rating"] == 5.0

    # Upsert rating
    rated2 = client.post(f"/api/resources/{rid}/rate", headers=headers_b, json={"score": 4})
    assert rated2.json()["avg_rating"] == 4.0


def test_rejects_bad_mime(client):
    headers = _auth(client, "mime_user", "mime-r@test.com")
    files = {"file": ("evil.exe", BytesIO(b"MZ"), "application/octet-stream")}
    data = {"title": "Malware", "category": "other"}
    res = client.post("/api/resources", headers=headers, data=data, files=files)
    assert res.status_code == 400


def test_only_owner_deletes(client):
    headers_a = _auth(client, "own_r", "own-r@test.com")
    headers_b = _auth(client, "oth_r", "oth-r@test.com")
    files = {"file": ("a.pdf", BytesIO(_pdf_bytes()), "application/pdf")}
    rid = client.post(
        "/api/resources",
        headers=headers_a,
        data={"title": "Solo mio", "category": "notes"},
        files=files,
    ).json()["id"]

    forbidden = client.delete(f"/api/resources/{rid}", headers=headers_b)
    assert forbidden.status_code == 403
    ok = client.delete(f"/api/resources/{rid}", headers=headers_a)
    assert ok.status_code == 204
