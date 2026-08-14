from app.core.config import settings


def test_mobile_version_is_public(client) -> None:
    response = client.get("/api/mobile/version")
    assert response.status_code == 200
    body = response.json()
    assert body["version"] == settings.mobile_latest_version
    assert body["version_code"] == settings.mobile_latest_version_code
    assert body["apk_url"].startswith("https://")
    assert isinstance(body["mandatory"], bool)
