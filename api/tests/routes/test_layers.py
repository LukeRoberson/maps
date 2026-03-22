def test_list_layers_requires_map_area_id(client):
    response = client.get("/api/layers")

    assert response.status_code == 400
    assert response.get_json()["error"] == "map_area_id parameter required"


def test_create_layer_requires_layer_type(client):
    response = client.post(
        "/api/layers",
        json={
            "map_area_id": 1,
            "name": "Layer without type",
        },
    )

    assert response.status_code == 400
    assert "Missing required field: layer_type" in response.get_json()["error"]


def test_create_and_list_layers(client, create_map_area):
    map_area = create_map_area()

    create_response = client.post(
        "/api/layers",
        json={
            "map_area_id": map_area["id"],
            "name": "Custom Layer",
            "layer_type": "custom",
            "config": {
                "color": "#00ff00",
                "line_thickness": 3,
            },
        },
    )
    created = create_response.get_json()

    list_response = client.get(f"/api/layers?map_area_id={map_area['id']}")
    listed = list_response.get_json()["layers"]

    assert create_response.status_code == 201
    assert created["name"] == "Custom Layer"
    assert list_response.status_code == 200
    assert any(layer["id"] == created["id"] for layer in listed)
