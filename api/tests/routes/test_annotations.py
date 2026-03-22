def test_list_annotations_requires_layer_id(client):
    response = client.get("/api/annotations")

    assert response.status_code == 400
    assert response.get_json()["error"] == "layer_id parameter required"


def test_create_annotation_rejects_invalid_style(client):
    response = client.post(
        "/api/annotations",
        json={
            "layer_id": 1,
            "annotation_type": "marker",
            "coordinates": [-33.86, 151.21],
            "style": {
                "color": "not-a-hex-color",
            },
        },
    )

    assert response.status_code == 400
    assert "Invalid style" in response.get_json()["error"]


def test_create_and_list_annotations(client, create_layer):
    layer = create_layer(layer_type="annotation")

    create_response = client.post(
        "/api/annotations",
        json={
            "layer_id": layer["id"],
            "annotation_type": "marker",
            "coordinates": [-33.8600, 151.2100],
            "style": {
                "color": "#00cc66",
                "weight": 2,
            },
        },
    )
    created = create_response.get_json()

    list_response = client.get(f"/api/annotations?layer_id={layer['id']}")
    listed = list_response.get_json()["annotations"]

    assert create_response.status_code == 201
    assert created["layer_id"] == layer["id"]
    assert list_response.status_code == 200
    assert any(annotation["id"] == created["id"] for annotation in listed)
