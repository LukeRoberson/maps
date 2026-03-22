import requests
import routes.tiles as tiles_routes


def test_proxy_tile_rejects_invalid_zoom(client):
    response = client.get("/api/tiles/wikimedia/99/0/0")

    assert response.status_code == 400
    assert b"Invalid zoom level" in response.data


def test_proxy_tile_rejects_invalid_coordinates(client):
    response = client.get("/api/tiles/wikimedia/1/3/0")

    assert response.status_code == 400
    assert b"Invalid tile coordinates" in response.data


def test_proxy_tile_returns_502_when_upstream_fails(client, monkeypatch):
    def fake_get(*args, **kwargs):
        raise requests.RequestException("upstream unavailable")

    monkeypatch.setattr(tiles_routes.requests, "get", fake_get)

    response = client.get("/api/tiles/wikimedia/1/0/0")

    assert response.status_code == 502
    assert b"Tile fetch failed" in response.data


def test_proxy_tile_returns_png_when_upstream_succeeds(client, monkeypatch):
    class UpstreamResponse:
        status_code = 200
        content = b"fake-png-content"

    monkeypatch.setattr(
        tiles_routes.requests,
        "get",
        lambda *args, **kwargs: UpstreamResponse(),
    )

    response = client.get("/api/tiles/wikimedia/1/0/0")

    assert response.status_code == 200
    assert response.mimetype == "image/png"
    assert response.data == b"fake-png-content"
    assert "max-age=" in response.headers.get("Cache-Control", "")
