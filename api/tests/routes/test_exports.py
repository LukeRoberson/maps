import routes.exports as exports_routes


def test_generate_export_requires_map_area_id(client):
    response = client.post(
        "/api/exports/generate",
        json={"zoom": 10},
    )

    assert response.status_code == 400
    assert (
        "Missing required field: map_area_id"
        in response.get_json()["error"]
    )


def test_generate_export_returns_png_when_service_succeeds(
    client,
    monkeypatch,
):
    def fake_generate(*args, **kwargs):
        return b"fake-png-bytes", "endpoint-export.png"

    monkeypatch.setattr(
        exports_routes.export_service,
        "generate",
        fake_generate,
    )

    response = client.post(
        "/api/exports/generate",
        json={
            "map_area_id": 123,
        },
    )

    assert response.status_code == 200
    assert response.mimetype == "image/png"
    assert response.data == b"fake-png-bytes"
    assert "endpoint-export.png" in response.headers["Content-Disposition"]


def test_download_export_returns_404_when_file_missing(client, monkeypatch):
    monkeypatch.setattr(
        exports_routes.export_service,
        "get_export_path",
        lambda _filename: None,
    )

    response = client.get("/api/exports/missing-file.png")

    assert response.status_code == 404
    assert response.get_json()["error"] == "File not found"
