"""Tests for campus events + RSVP (Fase 6)."""

from datetime import datetime, timedelta, timezone


def _auth(client, username, email):
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": "test1234"},
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "test1234"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _starts(hours=48):
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def test_create_rsvp_and_attendees(client):
    headers_a = _auth(client, "alice_e", "alice-e@test.com")
    headers_b = _auth(client, "bob_e", "bob-e@test.com")
    headers_c = _auth(client, "cara_e", "cara-e@test.com")

    created = client.post(
        "/api/events",
        headers=headers_a,
        json={
            "title": "Hackathon campus",
            "description": "24h de código",
            "location": "Aula 3",
            "starts_at": _starts(72),
        },
    )
    assert created.status_code == 201, created.text
    event = created.json()
    assert event["going_count"] == 1  # creator auto-RSVP
    eid = event["id"]

    for headers in (headers_b, headers_c):
        res = client.post(f"/api/events/{eid}/rsvp", headers=headers, json={"status": "going"})
        assert res.status_code == 200

    detail = client.get(f"/api/events/{eid}", headers=headers_a).json()
    assert detail["going_count"] == 3

    attendees = client.get(f"/api/events/{eid}/attendees", headers=headers_a).json()
    assert len(attendees) == 3

    stats = client.get("/api/stats", headers=headers_a).json()
    assert any(e["id"] == eid for e in stats.get("upcoming_events", []))


def test_only_creator_can_delete(client):
    headers_a = _auth(client, "own_e", "own-e@test.com")
    headers_b = _auth(client, "oth_e", "oth-e@test.com")
    eid = client.post(
        "/api/events",
        headers=headers_a,
        json={"title": "Meetup", "starts_at": _starts(24)},
    ).json()["id"]

    forbidden = client.delete(f"/api/events/{eid}", headers=headers_b)
    assert forbidden.status_code == 403
    ok = client.delete(f"/api/events/{eid}", headers=headers_a)
    assert ok.status_code == 204


def test_invalid_rsvp_status(client):
    headers = _auth(client, "rsvp_e", "rsvp-e@test.com")
    eid = client.post(
        "/api/events",
        headers=headers,
        json={"title": "Charla", "starts_at": _starts(12)},
    ).json()["id"]
    bad = client.post(f"/api/events/{eid}/rsvp", headers=headers, json={"status": "maybe"})
    assert bad.status_code == 422
